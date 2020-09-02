#!/usr/bin/env node

// @ts-check

"use strict";

// Requires
const fs = require("fs").promises;
const path = require("path");
const util = require("util");
const globby = require("globby");
const markdownlint = require("markdownlint");
const markdownlintRuleHelpers = require("markdownlint-rule-helpers");
const appendToArray = require("./append-to-array");

// Variables
const markdownlintPromise = util.promisify(markdownlint);
const markdownlintReadConfigPromise = util.promisify(markdownlint.readConfig);
const dotOnlySubstitute = "*.{md,markdown}";
const utf8 = "utf8";

// Parse JSONC text
const jsoncParse = (text) => JSON.parse(require("strip-json-comments")(text));

// Parse YAML text
const yamlParse = (text) => require("yaml").parse(text);

// Negate a glob
const negateGlob = (glob) => `!${glob}`;

// Read a JSON(C) or YAML file and return the object
const readConfig = (dir, name, otherwise) => {
  const file = path.join(dir, name);
  return () => fs.access(file).
    then(
      // @ts-ignore
      () => markdownlintReadConfigPromise(file, [ jsoncParse, yamlParse ]),
      otherwise
    );
};

// Require a module ID with the specified directory in the path
const requireResolve = (dir, id) => {
  const paths = [ dir, ...require.resolve.paths("") ];
  const resolved = require.resolve(id, { paths });
  return require(resolved);
};

// Require an array of modules by ID
const requireIds = (dir, ids) => ids.map((id) => requireResolve(dir, id));

// Require an array of modules by ID (preserving parameters)
const requireIdsAndParams = (dir, idsAndParams) => {
  const ids = idsAndParams.map((entry) => entry[0]);
  const modules = requireIds(dir, ids);
  const modulesAndParams = idsAndParams.
    map((entry, i) => [ modules[i], ...entry.slice(1) ]);
  return modulesAndParams;
};

// Require a JS file and return the exported object
const requireConfig = (dir, name, otherwise) => {
  const file = path.join(dir, name);
  return () => fs.access(file).
    then(
      () => requireResolve(dir, `./${name}`),
      otherwise
    );
};

// Main function
const main = async (argv, logMessage, logError) => {
  // Output help for missing arguments
  const globPatterns = argv.map((glob) => glob.replace(/^#/u, "!"));
  if (globPatterns.length === 0) {
    const { name, version, author, homepage } = require("./package.json");
    /* eslint-disable max-len */
    logMessage(`${name} version ${version} by ${author.name} (${author.url})
${homepage}

Syntax: ${name} glob0 [glob1] [...] [globN]

Glob expressions (from the globby library):
- * matches any number of characters, but not /
- ? matches a single character, but not /
- ** matches any number of characters, including / (when it's the only thing in a path part)
- {} allows for a comma-separated list of "or" expressions
- ! or # at the beginning of a pattern negate the match

Dot-only glob:
- The command "${name} ." would lint every file in the current directory tree which is probably not intended
- Instead, it is mapped to "${name} ${dotOnlySubstitute}" which lints all Markdown files in the current directory
- To lint every file in the current directory tree, the command "${name} **" can be used instead

Configuration via:
- .markdownlint-cli2.jsonc
- .markdownlint-cli2.yaml
- .markdownlint-cli2.js
- .markdownlint.jsonc or .markdownlint.json
- .markdownlint.yaml or .markdownlint.yml
- .markdownlint.js

Cross-platform compatibility:
- UNIX and Windows shells expand globs according to different rules, so quoting glob arguments is recommended
- Shells that expand globs do not support negated patterns (!node_modules), so quoting negated globs is required
- Some Windows shells do not handle single-quoted (') arguments correctly, so double-quotes (") are recommended
- Some UNIX shells handle exclamation (!) in double-quotes specially, so hashtag (#) is recommended for negated globs
- Some shells use backslash (\\) to escape special characters, so forward slash (/) is the recommended path separator

Therefore, the most compatible glob syntax for cross-platform support:
$ ${name} "**/*.md" "#node_modules"`
    );
    /* eslint-enable max-len */
    return 1;
  } else if ((globPatterns.length === 1) && (globPatterns[0] === ".")) {
    // Substitute a more reasonable pattern
    globPatterns[0] = dotOnlySubstitute;
  }

  // Read base ignore globs to pass as globby patterns (best performance)
  const tasks = [];
  const dirToDirInfo = {};
  const getAndProcessDirInfo = (dir, func) => {
    let dirInfo = dirToDirInfo[dir];
    if (!dirInfo) {
      dirInfo = {
        dir,
        "parent": null,
        "files": [],
        "markdownlintConfig": null,
        "markdownlintOptions": null
      };
      dirToDirInfo[dir] = dirInfo;
      const markdownlintCli2Jsonc = path.join(dir, ".markdownlint-cli2.jsonc");
      const markdownlintCli2Yaml = path.join(dir, ".markdownlint-cli2.yaml");
      tasks.push(
        fs.access(markdownlintCli2Jsonc).
          then(
            () => fs.readFile(markdownlintCli2Jsonc, utf8).then(jsoncParse),
            () => fs.access(markdownlintCli2Yaml).
              then(
                () => fs.readFile(markdownlintCli2Yaml, utf8).then(yamlParse),
                requireConfig(
                  dir,
                  ".markdownlint-cli2.js",
                  () => null
                )
              )
          ).
          then((options) => {
            dirInfo.markdownlintOptions = options;
          })
      );
      const readConfigs =
        readConfig(
          dir,
          ".markdownlint.jsonc",
          readConfig(
            dir,
            ".markdownlint.json",
            readConfig(
              dir,
              ".markdownlint.yaml",
              readConfig(
                dir,
                ".markdownlint.yml",
                requireConfig(
                  dir,
                  ".markdownlint.js",
                  () => null
                )
              )
            )
          )
        );
      tasks.push(
        readConfigs().
          then((config) => {
            dirInfo.markdownlintConfig = config;
          })
      );
    }
    if (func) {
      func(dirInfo);
    }
    return dirInfo;
  };
  getAndProcessDirInfo(".");
  await Promise.all(tasks);
  tasks.length = 0;
  const baseMarkdownlintOptions = dirToDirInfo["."].markdownlintOptions || {};
  const ignorePatterns = (baseMarkdownlintOptions.ignores || []).
    map(negateGlob);
  appendToArray(globPatterns, ignorePatterns);
  delete baseMarkdownlintOptions.ignores;
  const showProgress = !baseMarkdownlintOptions.noProgress;

  // Enumerate files from globs and build directory info list
  if (showProgress) {
    logMessage(`Finding: ${globPatterns.join(" ")}`);
  }
  for await (const file of globby.stream(globPatterns)) {
    // @ts-ignore
    const dir = path.dirname(file);
    getAndProcessDirInfo(dir, (dirInfo) => {
      dirInfo.files.push(file);
    });
  }
  await Promise.all(tasks);
  tasks.length = 0;

  // Fill out directory info list with parent directories
  for (let lastDirInfo of Object.values(dirToDirInfo)) {
    let { dir } = lastDirInfo;
    let lastDir = dir;
    while ((dir = path.dirname(dir)) && (dir !== lastDir)) {
      lastDir = dir;
      // eslint-disable-next-line no-loop-func
      lastDirInfo = getAndProcessDirInfo(dir, (dirInfo) => {
        lastDirInfo.parent = dirInfo;
      });
    }
  }
  await Promise.all(tasks);
  tasks.length = 0;

  // Merge file lists with identical configuration
  const dirs = Object.keys(dirToDirInfo);
  dirs.sort((a, b) => b.length - a.length);
  const dirInfos = [];
  const noConfigDirInfo =
    (dirInfo) => (
      dirInfo.parent &&
      !dirInfo.markdownlintConfig &&
      !dirInfo.markdownlintOptions
    );
  for (const dir of dirs) {
    const dirInfo = dirToDirInfo[dir];
    if ((dirInfo.files.length === 0) || noConfigDirInfo(dirInfo)) {
      if (dirInfo.parent) {
        appendToArray(dirInfo.parent.files, dirInfo.files);
      }
      dirToDirInfo[dir] = null;
    } else {
      dirInfos.push(dirInfo);
    }
  }
  for (const dirInfo of dirInfos) {
    while (dirInfo.parent && !dirToDirInfo[dirInfo.parent.dir]) {
      dirInfo.parent = dirInfo.parent.parent;
    }
  }

  // Verify dirInfos is simplified
  // if (dirInfos.filter((di) => !di.files.length).length > 0) {
  //   throw new Error("Empty files");
  // }
  // if (dirInfos.filter(
  //   (di) => di.parent && !dirInfos.includes(di.parent)).length > 0
  // ) {
  //   throw new Error("Extra parent");
  // }
  // if (
  //   dirInfos.filter(
  //     (di) => di.parent &&
  //       !((di.markdownlintConfig ? 1 : 0) ^ (di.markdownlintOptions ? 1 : 0))
  //   ).length > 0
  // ) {
  //   throw new Error("Missing object");
  // }

  // Merge configuration by inheritance
  for (const dirInfo of dirInfos) {
    let markdownlintOptions = dirInfo.markdownlintOptions || {};
    let parent = dirInfo;
    // eslint-disable-next-line prefer-destructuring
    while ((parent = parent.parent)) {
      if (parent.markdownlintOptions) {
        const config = {
          ...parent.markdownlintOptions.config,
          ...markdownlintOptions.config
        };
        markdownlintOptions = {
          ...parent.markdownlintOptions,
          ...markdownlintOptions,
          config
        };
      }
    }
    dirInfo.markdownlintOptions = markdownlintOptions;
  }

  // Lint each list of files
  if (showProgress) {
    const fileCount = dirInfos.reduce((p, c) => p + c.files.length, 0);
    logMessage(`Linting: ${fileCount} file(s)`);
  }
  for (const dirInfo of dirInfos) {
    const { dir, files, markdownlintConfig, markdownlintOptions } = dirInfo;
    let filteredFiles = files;
    if (markdownlintOptions.ignores) {
      const ignores = markdownlintOptions.ignores.map(negateGlob);
      const micromatch = require("micromatch");
      filteredFiles = micromatch(
        files.map((file) => path.relative(dir, file)),
        ignores
      ).map((file) => path.join(dir, file));
    }
    const options = {
      "files": filteredFiles,
      "config":
        markdownlintConfig || markdownlintOptions.config,
      "customRules":
        requireIds(dir, markdownlintOptions.customRules || []),
      "frontMatter": markdownlintOptions.frontMatter
        ? new RegExp(markdownlintOptions.frontMatter, "u")
        : undefined,
      "handleRuleFailures": true,
      "markdownItPlugins":
        requireIdsAndParams(dir, markdownlintOptions.markdownItPlugins || []),
      "noInlineConfig":
        Boolean(markdownlintOptions.noInlineConfig),
      "resultVersion": 3
    };
    let task = markdownlintPromise(options);
    if (markdownlintOptions.fix) {
      task = task.then((results) => {
        const subTasks = [];
        const errorFiles = Object.keys(results).
          filter((fileName) => Array.isArray(results[fileName]));
        for (const fileName of errorFiles) {
          const errorInfos = results[fileName].
            filter((errorInfo) => errorInfo.fixInfo);
          subTasks.push(fs.readFile(fileName, utf8).
            then((original) => {
              const fixed = markdownlintRuleHelpers.
                applyFixes(original, errorInfos);
              return fs.writeFile(fileName, fixed, utf8);
            })
          );
        }
        options.files = errorFiles;
        return Promise.all(subTasks).then(() => markdownlintPromise(options));
      });
    }
    tasks.push(task);
  }
  const taskResults = await Promise.all(tasks);
  tasks.length = 0;

  // Create summary of results
  const summary = [];
  let counter = 0;
  for (const results of taskResults) {
    for (const fileName in results) {
      const errorInfos = results[fileName];
      if (Array.isArray(errorInfos)) {
        for (const errorInfo of errorInfos) {
          const fileNameRelativePosix = path.
            relative("", fileName).
            split(path.sep).
            join(path.posix.sep);
          summary.push({
            "fileName": fileNameRelativePosix,
            ...errorInfo,
            counter
          });
          counter++;
        }
      }
    }
  }
  summary.sort((a, b) => (
    a.fileName.localeCompare(b.fileName) ||
    (a.lineNumber - b.lineNumber) ||
    a.ruleNames[0].localeCompare(b.ruleNames[0]) ||
    (a.counter - b.counter)
  ));
  summary.forEach((result) => delete result.counter);

  // Output summary via formatters
  if (showProgress) {
    logMessage(`Summary: ${summary.length} error(s)`);
  }
  const { outputFormatters } = baseMarkdownlintOptions;
  const errorsPresent = (summary.length > 0);
  if (errorsPresent || outputFormatters) {
    const formatterOptions = {
      "results": summary,
      logMessage,
      logError
    };
    const formattersAndParams = requireIdsAndParams(
      ".",
      outputFormatters || [ [ "markdownlint-cli2-formatter-default" ] ]
    );
    await Promise.all(formattersAndParams.map((formatterAndParams) => {
      const [ formatter, ...formatterParams ] = formatterAndParams;
      return formatter(formatterOptions, ...formatterParams);
    }));
  }

  // Done
  return errorsPresent ? 1 : 0;
};

// Run if invoked as a CLI, export if required as a module
// @ts-ignore
if (require.main === module) {
  (async () => {
    try {
      process.exitCode =
        await main(process.argv.slice(2), console.log, console.error);
    } catch (error) {
      console.error(error);
      process.exitCode = 2;
    }
  })();
} else {
  module.exports = main;
}
