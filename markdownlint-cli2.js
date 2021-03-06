#!/usr/bin/env node

// @ts-check

"use strict";

// Requires
const fs = require("fs").promises;
const path = require("path");
const globby = require("globby");
const markdownlintLibraryName = "markdownlint";
const markdownlintLibrary = require(markdownlintLibraryName);
const { markdownlint, "readConfig": markdownlintReadConfig } =
  markdownlintLibrary.promises;
const markdownlintRuleHelpers = require("markdownlint-rule-helpers");
const appendToArray = require("./append-to-array");

// Variables
const packageName = "markdownlint-cli2";
const packageVersion = "0.0.14";
const libraryVersion = markdownlintLibrary.getVersion();
const dotOnlySubstitute = "*.{md,markdown}";
const utf8 = "utf8";

// Parse JSONC text
const jsoncParse = (text) => JSON.parse(require("strip-json-comments")(text));

// Parse YAML text
const yamlParse = (text) => require("yaml").parse(text);

// Negate a glob
const negateGlob = (glob) => `!${glob}`;

// Return a posix path (even on Windows)
const posixPath = (p) => p.split(path.sep).join(path.posix.sep);

// Read a JSON(C) or YAML file and return the object
const readConfig = (dir, name, otherwise) => {
  const file = path.join(dir, name);
  return () => fs.access(file).
    then(
      // @ts-ignore
      () => markdownlintReadConfig(file, [ jsoncParse, yamlParse ]),
      otherwise
    );
};

// Require a module ID with the specified directory in the path
const requireResolve = (dir, id) => {
  if (typeof id === "string") {
    const paths = [ dir, ...require.resolve.paths("") ];
    const resolved = require.resolve(id, { paths });
    return require(resolved);
  }
  return id;
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

// Process command-line arguments and return glob patterns
const processArgv = (argv) => {
  const globPatterns = argv.map((glob) => glob.replace(/^#/u, "!"));
  if ((globPatterns.length === 1) && (globPatterns[0] === ".")) {
    // Substitute a more reasonable pattern
    globPatterns[0] = dotOnlySubstitute;
  }
  return globPatterns;
};

// Show help if missing arguments
const showHelp = (logMessage) => {
  const { name, homepage } = require("./package.json");
  /* eslint-disable max-len */
  logMessage(`${homepage}

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
};

// Get (creating if necessary) and process a directory's info object
const getAndProcessDirInfo = (tasks, dirToDirInfo, dir, func) => {
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

    // Load markdownlint-cli2 object(s)
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

    // Load markdownlint object(s)
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

// Get base markdownlint-cli2 options object
const getBaseOptions = async (baseDir, globPatterns, fixDefault) => {
  const tasks = [];
  const dirToDirInfo = {};
  getAndProcessDirInfo(tasks, dirToDirInfo, baseDir);
  await Promise.all(tasks);
  // eslint-disable-next-line no-multi-assign
  const baseMarkdownlintOptions = dirToDirInfo[baseDir].markdownlintOptions = {
    "fix": fixDefault,
    ...dirToDirInfo[baseDir].markdownlintOptions
  };

  // Append any globs specified in markdownlint-cli2 configuration
  const globs = baseMarkdownlintOptions.globs || [];
  appendToArray(globPatterns, globs);

  // Pass base ignore globs as globby patterns (best performance)
  const ignorePatterns =
    // eslint-disable-next-line unicorn/no-array-callback-reference
    (baseMarkdownlintOptions.ignores || []).map(negateGlob);
  appendToArray(globPatterns, ignorePatterns);
  delete baseMarkdownlintOptions.ignores;

  return {
    baseMarkdownlintOptions,
    dirToDirInfo
  };
};

// Enumerate files from globs and build directory infos
const enumerateFiles = async (baseDir, globPatterns, dirToDirInfo) => {
  const tasks = [];
  const globbyOptions = {
    "absolute": true,
    "cwd": baseDir
  };
  for await (const file of globby.stream(globPatterns, globbyOptions)) {
    // @ts-ignore
    const dir = path.dirname(file);
    getAndProcessDirInfo(tasks, dirToDirInfo, dir, (dirInfo) => {
      dirInfo.files.push(file);
    });
  }
  await Promise.all(tasks);
};

// Enumerate (possibly missing) parent directories and update directory infos
const enumerateParents = async (baseDir, dirToDirInfo) => {
  const tasks = [];

  // Create a lookup of baseDir and parents
  const baseDirParents = {};
  let baseDirParent = baseDir;
  do {
    baseDirParents[baseDirParent] = true;
    baseDirParent = path.dirname(baseDirParent);
  } while (!baseDirParents[baseDirParent]);

  // Visit parents of each dirInfo
  for (let lastDirInfo of Object.values(dirToDirInfo)) {
    let { dir } = lastDirInfo;
    let lastDir = dir;
    while (
      !baseDirParents[dir] &&
      (dir = path.dirname(dir)) &&
      (dir !== lastDir)
    ) {
      lastDir = dir;
      lastDirInfo =
        // eslint-disable-next-line no-loop-func
        getAndProcessDirInfo(tasks, dirToDirInfo, dir, (dirInfo) => {
          lastDirInfo.parent = dirInfo;
        });
    }

    // If dir not under baseDir, inject it as parent for configuration
    if (dir !== baseDir) {
      dirToDirInfo[dir].parent = dirToDirInfo[baseDir];
    }
  }
  await Promise.all(tasks);
};

// Create directory info objects by enumerating file globs
const createDirInfos =
async (baseDir, globPatterns, dirToDirInfo, optionsOverride) => {
  await enumerateFiles(baseDir, globPatterns, dirToDirInfo);
  await enumerateParents(baseDir, dirToDirInfo);

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
    if (noConfigDirInfo(dirInfo)) {
      if (dirInfo.parent) {
        appendToArray(dirInfo.parent.files, dirInfo.files);
      }
      dirToDirInfo[dir] = null;
    } else {
      const { markdownlintOptions } = dirInfo;
      if (markdownlintOptions) {
        markdownlintOptions.customRules =
          requireIds(dir, markdownlintOptions.customRules || []);
        markdownlintOptions.markdownItPlugins =
          requireIdsAndParams(dir, markdownlintOptions.markdownItPlugins || []);
      }
      dirInfos.push(dirInfo);
    }
  }
  for (const dirInfo of dirInfos) {
    while (dirInfo.parent && !dirToDirInfo[dirInfo.parent.dir]) {
      dirInfo.parent = dirInfo.parent.parent;
    }
  }

  // Verify dirInfos is simplified
  // if (
  //   dirInfos.filter(
  //     (di) => di.parent && !dirInfos.includes(di.parent)
  //   ).length > 0
  // ) {
  //   throw new Error("Extra parent");
  // }
  // if (
  //   dirInfos.filter(
  //     (di) => !di.parent && (di.dir !== baseDir)
  //   ).length > 0
  // ) {
  //   throw new Error("Missing parent");
  // }
  // if (
  //   dirInfos.filter(
  //     (di) => di.parent &&
  //       !((di.markdownlintConfig ? 1 : 0) ^ (di.markdownlintOptions ? 1 : 0))
  //   ).length > 0
  // ) {
  //   throw new Error("Missing object");
  // }
  // if (dirInfos.filter((di) => di.dir === "/").length > 0) {
  //   throw new Error("Includes root");
  // }

  // Merge configuration by inheritance
  for (const dirInfo of dirInfos) {
    let markdownlintOptions = dirInfo.markdownlintOptions || {};
    let { markdownlintConfig } = dirInfo;
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
      if (
        !markdownlintConfig &&
        parent.markdownlintConfig &&
        !markdownlintOptions.config
      ) {
        // eslint-disable-next-line prefer-destructuring
        markdownlintConfig = parent.markdownlintConfig;
      }
    }
    dirInfo.markdownlintConfig = markdownlintConfig;
    dirInfo.markdownlintOptions = {
      ...markdownlintOptions,
      ...optionsOverride
    };
  }
  return dirInfos;
};

// Lint files in groups by shared configuration
const lintFiles = async (dirInfos) => {
  const tasks = [];
  for (const dirInfo of dirInfos) {
    const { dir, files, markdownlintConfig, markdownlintOptions } = dirInfo;
    let filteredFiles = files;
    if (markdownlintOptions.ignores) {
      // eslint-disable-next-line unicorn/no-array-callback-reference
      const ignores = markdownlintOptions.ignores.map(negateGlob);
      const micromatch = require("micromatch");
      filteredFiles = micromatch(
        files.map((file) => path.relative(dir, file)),
        ignores
      ).map((file) => path.join(dir, file));
    }
    const options = {
      "files": filteredFiles,
      "config": markdownlintConfig || markdownlintOptions.config,
      "customRules": markdownlintOptions.customRules,
      "frontMatter": markdownlintOptions.frontMatter
        ? new RegExp(markdownlintOptions.frontMatter, "u")
        : undefined,
      "handleRuleFailures": true,
      "markdownItPlugins": markdownlintOptions.markdownItPlugins,
      "noInlineConfig": Boolean(markdownlintOptions.noInlineConfig),
      "resultVersion": 3
    };
    let task = markdownlint(options);
    if (markdownlintOptions.fix) {
      task = task.then((results) => {
        options.files = [];
        const subTasks = [];
        const errorFiles = Object.keys(results);
        for (const fileName of errorFiles) {
          const errorInfos = results[fileName].
            filter((errorInfo) => errorInfo.fixInfo);
          if (errorInfos.length > 0) {
            delete results[fileName];
            options.files.push(fileName);
            subTasks.push(fs.readFile(fileName, utf8).
              then((original) => {
                const fixed = markdownlintRuleHelpers.
                  applyFixes(original, errorInfos);
                return fs.writeFile(fileName, fixed, utf8);
              })
            );
          }
        }
        return Promise.all(subTasks).
          then(() => markdownlint(options)).
          then((fixResults) => ({
            ...results,
            ...fixResults
          }));
      });
    }
    tasks.push(task);
  }
  const taskResults = await Promise.all(tasks);
  return taskResults;
};

// Create summary of results
const createSummary = (baseDir, taskResults) => {
  const summary = [];
  let counter = 0;
  for (const results of taskResults) {
    for (const fileName in results) {
      const errorInfos = results[fileName];
      for (const errorInfo of errorInfos) {
        const fileNameRelativePosix =
          posixPath(path.relative(baseDir, fileName));
        summary.push({
          "fileName": fileNameRelativePosix,
          ...errorInfo,
          counter
        });
        counter++;
      }
    }
  }
  summary.sort((a, b) => (
    a.fileName.localeCompare(b.fileName) ||
    (a.lineNumber - b.lineNumber) ||
    a.ruleNames[0].localeCompare(b.ruleNames[0]) ||
    (a.counter - b.counter)
  ));
  for (const result of summary) {
    delete result.counter;
  }
  return summary;
};

// Output summary via formatters
const outputSummary =
  async (baseDir, summary, outputFormatters, logMessage, logError) => {
    const errorsPresent = (summary.length > 0);
    if (errorsPresent || outputFormatters) {
      const formatterOptions = {
        "directory": baseDir,
        "results": summary,
        logMessage,
        logError
      };
      const formattersAndParams = outputFormatters
        ? requireIdsAndParams(baseDir, outputFormatters)
        : [ [ require("markdownlint-cli2-formatter-default") ] ];
      await Promise.all(formattersAndParams.map((formatterAndParams) => {
        const [ formatter, ...formatterParams ] = formatterAndParams;
        return formatter(formatterOptions, ...formatterParams);
      }));
    }
    return errorsPresent;
  };

// Main function
const main = async (params) => {
  const { directory, argv, logMessage, logError, optionsOverride,
    fixDefault } = params;
  const baseDir = posixPath(directory || process.cwd());
  logMessage(
    `${packageName} v${packageVersion} ` +
    `(${markdownlintLibraryName} v${libraryVersion})`
  );
  const globPatterns = processArgv(argv);
  const { baseMarkdownlintOptions, dirToDirInfo } =
    await getBaseOptions(baseDir, globPatterns, fixDefault);
  if (globPatterns.length === 0) {
    showHelp(logMessage);
    return 1;
  }
  const showProgress = !baseMarkdownlintOptions.noProgress;
  if (showProgress) {
    logMessage(`Finding: ${globPatterns.join(" ")}`);
  }
  const dirInfos =
    await createDirInfos(baseDir, globPatterns, dirToDirInfo, optionsOverride);
  if (showProgress) {
    let fileCount = 0;
    for (const dirInfo of dirInfos) {
      fileCount += dirInfo.files.length;
    }
    logMessage(`Linting: ${fileCount} file(s)`);
  }
  const lintResults = await lintFiles(dirInfos);
  const summary = createSummary(baseDir, lintResults);
  if (showProgress) {
    logMessage(`Summary: ${summary.length} error(s)`);
  }
  const outputFormatters =
    (optionsOverride && optionsOverride.outputFormatters) ||
    baseMarkdownlintOptions.outputFormatters;
  const errorsPresent = await outputSummary(
    baseDir, summary, outputFormatters, logMessage, logError
  );
  return errorsPresent ? 1 : 0;
};

// Run function
const run = (overrides) => {
  (async () => {
    try {
      const defaultParams = {
        "argv": process.argv.slice(2),
        "logMessage": console.log,
        "logError": console.error
      };
      const params = {
        ...defaultParams,
        ...overrides
      };
      process.exitCode = await main(params);
    } catch (error) {
      console.error(error);
      process.exitCode = 2;
    }
  })();
};

// Export functions
module.exports = {
  main,
  run
};

// Run if invoked as a CLI
// @ts-ignore
if (require.main === module) {
  run();
}
