#!/usr/bin/env node

// @ts-check

"use strict";

// @ts-ignore
// eslint-disable-next-line camelcase, max-len, no-inline-comments, no-undef
const dynamicRequire = (typeof __non_webpack_require__ === "undefined") ? require : /* c8 ignore next */ __non_webpack_require__;
// Capture native require implementation for dynamic loading of modules

// Requires
const path = require("path");
const globby = require("globby");
const markdownlintLibrary = require("markdownlint");
const { markdownlint, "readConfig": markdownlintReadConfig } =
  markdownlintLibrary.promises;
const markdownlintRuleHelpers = require("markdownlint-rule-helpers");
const appendToArray = require("./append-to-array");
const mergeOptions = require("./merge-options");
const resolveAndRequire = require("./resolve-and-require");

// Variables
const packageName = "markdownlint-cli2";
const packageVersion = "0.3.1";
const libraryName = "markdownlint";
const libraryVersion = markdownlintLibrary.getVersion();
const dotOnlySubstitute = "*.{md,markdown}";
const utf8 = "utf8";

// No-op function
const noop = () => null;

// Parse JSONC text
const jsoncParse = (text) => JSON.parse(require("strip-json-comments")(text));

// Parse YAML text
const yamlParse = (text) => require("yaml").parse(text);

// Negate a glob
const negateGlob = (glob) => `!${glob}`;

// Return a posix path (even on Windows)
const posixPath = (p) => p.split(path.sep).join(path.posix.sep);

// Read a JSON(C) or YAML file and return the object
const readConfig = (fs, dir, name, otherwise) => {
  const file = path.posix.join(dir, name);
  return () => fs.promises.access(file).
    then(
      // @ts-ignore
      () => markdownlintReadConfig(file, [ jsoncParse, yamlParse ], fs),
      otherwise
    );
};

// Require a module ID with the specified directory in the path
const requireResolve = (dir, id) => {
  if (typeof id === "string") {
    return resolveAndRequire(dynamicRequire, id, dir);
  }
  return id;
};

// Require an array of modules by ID
const requireIds = (dir, ids, noRequire) => (
  noRequire ? [] : ids.map((id) => requireResolve(dir, id))
);

// Require an array of modules by ID (preserving parameters)
const requireIdsAndParams = (dir, idsAndParams, noRequire) => {
  if (noRequire) {
    return [];
  }
  const ids = idsAndParams.map((entry) => entry[0]);
  const modules = requireIds(dir, ids);
  const modulesAndParams = idsAndParams.
    map((entry, i) => [ modules[i], ...entry.slice(1) ]);
  return modulesAndParams;
};

// Require a JS file and return the exported object
const requireConfig = (fs, dir, name, noRequire) => (
  () => (noRequire
    // eslint-disable-next-line prefer-promise-reject-errors
    ? Promise.reject()
    : fs.promises.access(path.posix.join(dir, name))
  ).
    then(
      () => requireResolve(dir, `./${name}`),
      noop
    )
);

// Process command-line arguments and return glob patterns
const processArgv = (argv) => {
  const globPatterns = (argv || []).map(
    (glob) => glob.replace(/^#/u, "!").replace(/\\(?![$()*+?[\]^])/gu, "/")
  );
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
- UNIX and Windows shells expand globs according to different rules; quoting arguments is recommended
- Some Windows shells don't handle single-quoted (') arguments well; double-quote (") is recommended
- Shells that expand globs do not support negated patterns (!node_modules); quoting is required here
- Some UNIX shells parse exclamation (!) in double-quotes; hashtag (#) is recommended in these cases
- The path separator is forward slash (/) on all platforms; backslash (\\) is automatically converted

Therefore, the most compatible glob syntax for cross-platform support:
$ ${name} "**/*.md" "#node_modules"`
  );
  /* eslint-enable max-len */
};

// Get (creating if necessary) and process a directory's info object
const getAndProcessDirInfo =
(fs, tasks, dirToDirInfo, dir, noRequire, func) => {
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
    const markdownlintCli2Jsonc =
      path.posix.join(dir, ".markdownlint-cli2.jsonc");
    const markdownlintCli2Yaml =
      path.posix.join(dir, ".markdownlint-cli2.yaml");
    tasks.push(
      fs.promises.access(markdownlintCli2Jsonc).
        then(
          () => fs.promises.
            readFile(markdownlintCli2Jsonc, utf8).
            then(jsoncParse),
          () => fs.promises.access(markdownlintCli2Yaml).
            then(
              () => fs.promises.
                readFile(markdownlintCli2Yaml, utf8).
                then(yamlParse),
              requireConfig(
                fs,
                dir,
                ".markdownlint-cli2.js",
                noRequire
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
        fs,
        dir,
        ".markdownlint.jsonc",
        readConfig(
          fs,
          dir,
          ".markdownlint.json",
          readConfig(
            fs,
            dir,
            ".markdownlint.yaml",
            readConfig(
              fs,
              dir,
              ".markdownlint.yml",
              requireConfig(
                fs,
                dir,
                ".markdownlint.js",
                noRequire
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
const getBaseOptions = async (
  fs,
  baseDir,
  globPatterns,
  optionsDefault,
  fixDefault,
  noGlobs,
  noRequire
) => {
  const tasks = [];
  const dirToDirInfo = {};
  getAndProcessDirInfo(fs, tasks, dirToDirInfo, baseDir, noRequire);
  await Promise.all(tasks);
  // eslint-disable-next-line no-multi-assign
  const baseMarkdownlintOptions = dirToDirInfo[baseDir].markdownlintOptions =
    mergeOptions(
      mergeOptions(optionsDefault, { "fix": fixDefault }),
      dirToDirInfo[baseDir].markdownlintOptions
    );

  if (!noGlobs) {
    // Append any globs specified in markdownlint-cli2 configuration
    const globs = baseMarkdownlintOptions.globs || [];
    appendToArray(globPatterns, globs);
  }

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
const enumerateFiles =
async (fs, baseDir, globPatterns, dirToDirInfo, noErrors, noRequire) => {
  const tasks = [];
  const globbyOptions = {
    "absolute": true,
    "cwd": baseDir,
    "expandDirectories": false,
    fs
  };
  if (noErrors) {
    globbyOptions.suppressErrors = true;
  }
  // Manually expand directories to avoid globby call to dir-glob.sync
  const expandedDirectories = await Promise.all(
    globPatterns.map((globPattern) => {
      const globPath = path.posix.join(
        baseDir,
        globPattern[0] === "!" ? globPattern.slice(1) : globPattern
      );
      return fs.promises.stat(globPath).
        then((stats) => (stats.isDirectory()
          ? path.posix.join(globPattern, "**")
          : globPattern)).
        catch(() => globPattern);
    })
  );
  // Process glob patterns
  const files = await globby(expandedDirectories, globbyOptions);
  for (const file of files) {
    const dir = path.posix.dirname(file);
    getAndProcessDirInfo(
      fs,
      tasks,
      dirToDirInfo,
      dir,
      noRequire,
      (dirInfo) => {
        dirInfo.files.push(file);
      }
    );
  }
  await Promise.all(tasks);
};

// Enumerate (possibly missing) parent directories and update directory infos
const enumerateParents = async (fs, baseDir, dirToDirInfo, noRequire) => {
  const tasks = [];

  // Create a lookup of baseDir and parents
  const baseDirParents = {};
  let baseDirParent = baseDir;
  do {
    baseDirParents[baseDirParent] = true;
    baseDirParent = path.posix.dirname(baseDirParent);
  } while (!baseDirParents[baseDirParent]);

  // Visit parents of each dirInfo
  for (let lastDirInfo of Object.values(dirToDirInfo)) {
    let { dir } = lastDirInfo;
    let lastDir = dir;
    while (
      !baseDirParents[dir] &&
      (dir = path.posix.dirname(dir)) &&
      (dir !== lastDir)
    ) {
      lastDir = dir;
      lastDirInfo =
        getAndProcessDirInfo(
          fs,
          tasks,
          dirToDirInfo,
          dir,
          noRequire,
          // eslint-disable-next-line no-loop-func
          (dirInfo) => {
            lastDirInfo.parent = dirInfo;
          }
        );
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
// eslint-disable-next-line max-len
async (fs, baseDir, globPatterns, dirToDirInfo, optionsOverride, noErrors, noRequire) => {
  await enumerateFiles(
    fs,
    baseDir,
    globPatterns,
    dirToDirInfo,
    noErrors,
    noRequire
  );
  await enumerateParents(
    fs,
    baseDir,
    dirToDirInfo,
    noRequire
  );

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
      if (markdownlintOptions && markdownlintOptions.customRules) {
        const customRules =
          requireIds(
            dir,
            markdownlintOptions.customRules,
            noRequire
          );
        // Expand nested arrays (for packages that export multiple rules)
        markdownlintOptions.customRules = customRules.flat();
      }
      if (markdownlintOptions && markdownlintOptions.markdownItPlugins) {
        markdownlintOptions.markdownItPlugins =
          requireIdsAndParams(
            dir,
            markdownlintOptions.markdownItPlugins,
            noRequire
          );
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
        markdownlintOptions = mergeOptions(
          parent.markdownlintOptions,
          markdownlintOptions
        );
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
    dirInfo.markdownlintOptions = mergeOptions(
      markdownlintOptions,
      optionsOverride
    );
    dirInfo.markdownlintConfig = markdownlintConfig;
  }
  return dirInfos;
};

// Lint files in groups by shared configuration
const lintFiles = (fs, dirInfos, fileContents) => {
  const tasks = [];
  // For each dirInfo
  for (const dirInfo of dirInfos) {
    const { dir, files, markdownlintConfig, markdownlintOptions } = dirInfo;
    // Filter file/string inputs to only those in the dirInfo
    let filesAfterIgnores = files;
    if (markdownlintOptions.ignores) {
      // eslint-disable-next-line unicorn/no-array-callback-reference
      const ignores = markdownlintOptions.ignores.map(negateGlob);
      const micromatch = require("micromatch");
      filesAfterIgnores = micromatch(
        files.map((file) => path.posix.relative(dir, file)),
        ignores
      ).map((file) => path.posix.join(dir, file));
    }
    const filteredFiles = filesAfterIgnores.filter(
      (file) => fileContents[file] === undefined
    );
    const filteredStrings = {};
    for (const file of filesAfterIgnores) {
      if (fileContents[file] !== undefined) {
        filteredStrings[file] = fileContents[file];
      }
    }
    // Create markdownlint options object
    const options = {
      "files": filteredFiles,
      "strings": filteredStrings,
      "config": markdownlintConfig || markdownlintOptions.config,
      "customRules": markdownlintOptions.customRules,
      "frontMatter": markdownlintOptions.frontMatter
        ? new RegExp(markdownlintOptions.frontMatter, "u")
        : undefined,
      "handleRuleFailures": true,
      "markdownItPlugins": markdownlintOptions.markdownItPlugins,
      "noInlineConfig": Boolean(markdownlintOptions.noInlineConfig),
      "resultVersion": 3,
      fs
    };
    // Invoke markdownlint
    // @ts-ignore
    let task = markdownlint(options);
    // For any fixable errors, read file, apply fixes, and write it back
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
            subTasks.push(fs.promises.readFile(fileName, utf8).
              then((original) => {
                const fixed = markdownlintRuleHelpers.
                  applyFixes(original, errorInfos);
                return fs.promises.writeFile(fileName, fixed, utf8);
              })
            );
          }
        }
        return Promise.all(subTasks).
          // @ts-ignore
          then(() => markdownlint(options)).
          then((fixResults) => ({
            ...results,
            ...fixResults
          }));
      });
    }
    // Queue tasks for this dirInfo
    tasks.push(task);
  }
  // Return result of all tasks
  return Promise.all(tasks);
};

// Create summary of results
const createSummary = (baseDir, taskResults) => {
  const summary = [];
  let counter = 0;
  for (const results of taskResults) {
    for (const fileName in results) {
      const errorInfos = results[fileName];
      for (const errorInfo of errorInfos) {
        const fileNameRelative = path.posix.relative(baseDir, fileName);
        summary.push({
          "fileName": fileNameRelative,
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
  // Capture parameters
  const {
    directory,
    argv,
    optionsDefault,
    optionsOverride,
    fixDefault,
    fileContents,
    nonFileContents,
    noErrors,
    noGlobs,
    noRequire
  } = params;
  const logMessage = params.logMessage || noop;
  const logError = params.logError || noop;
  const fs = params.fs || require("fs");
  const baseDirSystem =
    (directory && path.resolve(directory)) ||
    process.cwd();
  const baseDir = posixPath(baseDirSystem);
  // Output banner
  logMessage(
    `${packageName} v${packageVersion} (${libraryName} v${libraryVersion})`
  );
  // Process arguments and get base options
  const globPatterns = processArgv(argv);
  const { baseMarkdownlintOptions, dirToDirInfo } =
    await getBaseOptions(
      fs,
      baseDir,
      globPatterns,
      optionsDefault,
      fixDefault,
      noGlobs,
      noRequire
    );
  if ((globPatterns.length === 0) && !nonFileContents) {
    showHelp(logMessage);
    return 1;
  }
  // Include any file overrides or non-file content
  const resolvedFileContents = {};
  for (const file in fileContents) {
    const resolvedFile = posixPath(path.resolve(baseDirSystem, file));
    resolvedFileContents[resolvedFile] =
      fileContents[file];
  }
  for (const nonFile in nonFileContents) {
    resolvedFileContents[nonFile] = nonFileContents[nonFile];
  }
  appendToArray(
    dirToDirInfo[baseDir].files,
    Object.keys(nonFileContents || {})
  );
  // Output finding status
  const showProgress = !baseMarkdownlintOptions.noProgress;
  if (showProgress) {
    logMessage(`Finding: ${globPatterns.join(" ")}`);
  }
  // Create linting tasks
  const dirInfos =
    await createDirInfos(
      fs,
      baseDir,
      globPatterns,
      dirToDirInfo,
      optionsOverride,
      noErrors,
      noRequire
    );
  // Output linting status
  if (showProgress) {
    let fileCount = 0;
    for (const dirInfo of dirInfos) {
      fileCount += dirInfo.files.length;
    }
    logMessage(`Linting: ${fileCount} file(s)`);
  }
  // Lint files
  const lintResults = await lintFiles(fs, dirInfos, resolvedFileContents);
  // Output summary
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
  // Return result
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
