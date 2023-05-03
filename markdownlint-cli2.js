#!/usr/bin/env node

// @ts-check

"use strict";

// @ts-ignore
// eslint-disable-next-line camelcase, max-len, no-inline-comments, no-undef
const dynamicRequire = (typeof __non_webpack_require__ === "undefined") ? require : /* c8 ignore next */ __non_webpack_require__;
// Capture native require implementation for dynamic loading of modules

// Requires
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const markdownlintLibrary = require("markdownlint");
const {
  markdownlint,
  "extendConfig": markdownlintExtendConfig,
  "readConfig": markdownlintReadConfig
} = markdownlintLibrary.promises;
const markdownlintRuleHelpers = require("markdownlint/helpers");
const appendToArray = require("./append-to-array");
const mergeOptions = require("./merge-options");
const resolveAndRequire = require("./resolve-and-require");

// Variables
const packageName = "markdownlint-cli2";
const packageVersion = "0.7.1";
const libraryName = "markdownlint";
const libraryVersion = markdownlintLibrary.getVersion();
const dotOnlySubstitute = "*.{md,markdown}";
const utf8 = "utf8";

// No-op function
const noop = () => null;

// Gets a synchronous function to parse JSONC text
const getJsoncParse = async () => {
  const { "default": stripJsonComments } =
    // eslint-disable-next-line no-inline-comments
    await import(/* webpackMode: "eager" */ "strip-json-comments");
  return (text) => JSON.parse(stripJsonComments(text));
};

// Synchronous function to parse YAML text
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
      () => getJsoncParse().then(
        (jsoncParse) => markdownlintReadConfig(
          file,
          [ jsoncParse, yamlParse ],
          fs
        )
      ),
      otherwise
    );
};

// Import or resolve/require a module ID with a custom directory in the path
const importOrRequireResolve = async (dir, id) => {
  if (typeof id === "string") {
    const expandId =
      markdownlintRuleHelpers.expandTildePath(id, require("node:os"));
    const errors = [];
    try {
      return resolveAndRequire(dynamicRequire, expandId, dir);
    } catch (error) {
      errors.push(error);
    }
    try {
      const fileUrlString =
        pathToFileURL(path.resolve(dir, expandId)).toString();
      // eslint-disable-next-line no-inline-comments
      const module = await import(/* webpackIgnore: true */ fileUrlString);
      return module.default;
    } catch (error) {
      errors.push(error);
    }
    // @ts-ignore
    throw new AggregateError(
      errors,
      `Unable to require or import module '${id}'.`
    );
  }
  return id;
};

// Import or require an array of modules by ID
const importOrRequireIds = (dir, ids, noRequire) => (
  Promise.all(noRequire ? [] : ids.map((id) => importOrRequireResolve(dir, id)))
);

// Import or require an array of modules by ID (preserving parameters)
const importOrRequireIdsAndParams = async (dir, idsAndParams, noRequire) => {
  if (noRequire) {
    return [];
  }
  const ids = idsAndParams.map((entry) => entry[0]);
  const modules = await importOrRequireIds(dir, ids);
  const modulesAndParams = idsAndParams.
    map((entry, i) => [ modules[i], ...entry.slice(1) ]);
  return modulesAndParams;
};

// Import or require a JavaScript file and return the exported object
const importOrRequireConfig = (fs, dir, name, noRequire, otherwise) => (
  () => (noRequire
    // eslint-disable-next-line prefer-promise-reject-errors
    ? Promise.reject()
    : fs.promises.access(path.posix.join(dir, name))
  ).
    then(
      () => importOrRequireResolve(dir, `./${name}`),
      otherwise
    )
);

// Read an options or config file in any format and return the object
const readOptionsOrConfig = async (configPath, fs, noRequire) => {
  const basename = path.basename(configPath);
  const dirname = path.dirname(configPath);
  let options = null;
  let config = null;
  if (basename.endsWith(".markdownlint-cli2.jsonc")) {
    const jsoncParse = await getJsoncParse();
    options = jsoncParse(await fs.promises.readFile(configPath, utf8));
  } else if (basename.endsWith(".markdownlint-cli2.yaml")) {
    options = yamlParse(await fs.promises.readFile(configPath, utf8));
  } else if (
    basename.endsWith(".markdownlint-cli2.cjs") ||
    basename.endsWith(".markdownlint-cli2.mjs")
  ) {
    options = await (
      importOrRequireConfig(fs, dirname, basename, noRequire, noop)()
    );
  } else if (
    basename.endsWith(".markdownlint.jsonc") ||
    basename.endsWith(".markdownlint.json") ||
    basename.endsWith(".markdownlint.yaml") ||
    basename.endsWith(".markdownlint.yml")
  ) {
    const jsoncParse = await getJsoncParse();
    config =
      await markdownlintReadConfig(configPath, [ jsoncParse, yamlParse ], fs);
  } else if (
    basename.endsWith(".markdownlint.cjs") ||
    basename.endsWith(".markdownlint.mjs")
  ) {
    config = await (
      importOrRequireConfig(fs, dirname, basename, noRequire, noop)()
    );
  } else {
    throw new Error(
      `Configuration file "${configPath}" is unrecognized; ` +
      "its name should be (or end with) one of the supported types " +
      "(e.g., \".markdownlint.json\" or \"example.markdownlint-cli2.jsonc\")."
    );
  }
  return options || { config };
};

// Filter a list of files to ignore by glob
const removeIgnoredFiles = (dir, files, ignores) => {
  const micromatch = require("micromatch");
  return micromatch(
    files.map((file) => path.posix.relative(dir, file)),
    ignores
  ).map((file) => path.posix.join(dir, file));
};

// Process/normalize command-line arguments and return glob patterns
const processArgv = (argv) => {
  const globPatterns = (argv || []).map(
    (glob) => {
      if (glob.startsWith(":")) {
        return glob;
      }
      // Escape RegExp special characters recognized by fast-glob
      // https://github.com/mrmlnc/fast-glob#advanced-syntax
      const specialCharacters = /\\(?![$()*+?[\]^])/gu;
      if (glob.startsWith("\\:")) {
        return `\\:${glob.slice(2).replace(specialCharacters, "/")}`;
      }
      return (glob.startsWith("#") ? `!${glob.slice(1)}` : glob).
        replace(specialCharacters, "/");
    }
  );
  if ((globPatterns.length === 1) && (globPatterns[0] === ".")) {
    // Substitute a more reasonable pattern
    globPatterns[0] = dotOnlySubstitute;
  }
  return globPatterns;
};

// Show help if missing arguments
const showHelp = (logMessage) => {
  /* eslint-disable max-len */
  logMessage(`https://github.com/DavidAnson/markdownlint-cli2

Syntax: markdownlint-cli2 glob0 [glob1] [...] [globN]
        markdownlint-cli2-fix glob0 [glob1] [...] [globN]
        markdownlint-cli2-config config-file glob0 [glob1] [...] [globN]

Glob expressions (from the globby library):
- * matches any number of characters, but not /
- ? matches a single character, but not /
- ** matches any number of characters, including /
- {} allows for a comma-separated list of "or" expressions
- ! or # at the beginning of a pattern negate the match
- : at the beginning identifies a literal file path

Dot-only glob:
- The command "markdownlint-cli2 ." would lint every file in the current directory tree which is probably not intended
- Instead, it is mapped to "markdownlint-cli2 ${dotOnlySubstitute}" which lints all Markdown files in the current directory
- To lint every file in the current directory tree, the command "markdownlint-cli2 **" can be used instead

Configuration via:
- .markdownlint-cli2.jsonc
- .markdownlint-cli2.yaml
- .markdownlint-cli2.cjs or .markdownlint-cli2.mjs
- .markdownlint.jsonc or .markdownlint.json
- .markdownlint.yaml or .markdownlint.yml
- .markdownlint.cjs or .markdownlint.mjs

Cross-platform compatibility:
- UNIX and Windows shells expand globs according to different rules; quoting arguments is recommended
- Some Windows shells don't handle single-quoted (') arguments well; double-quote (") is recommended
- Shells that expand globs do not support negated patterns (!node_modules); quoting is required here
- Some UNIX shells parse exclamation (!) in double-quotes; hashtag (#) is recommended in these cases
- The path separator is forward slash (/) on all platforms; backslash (\\) is automatically converted

The most compatible syntax for cross-platform support:
$ markdownlint-cli2 "**/*.md" "#node_modules"`
  );
  /* eslint-enable max-len */
};

// Get (creating if necessary) and process a directory's info object
const getAndProcessDirInfo =
  (fs, tasks, dirToDirInfo, dir, relativeDir, noRequire, func) => {
    let dirInfo = dirToDirInfo[dir];
    if (!dirInfo) {
      dirInfo = {
        dir,
        relativeDir,
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
              then(
                (content) => getJsoncParse().
                  then((jsoncParse) => jsoncParse(content))
              ),
            () => fs.promises.access(markdownlintCli2Yaml).
              then(
                () => fs.promises.
                  readFile(markdownlintCli2Yaml, utf8).
                  then(yamlParse),
                importOrRequireConfig(
                  fs,
                  dir,
                  ".markdownlint-cli2.cjs",
                  noRequire,
                  importOrRequireConfig(
                    fs,
                    dir,
                    ".markdownlint-cli2.mjs",
                    noRequire,
                    noop
                  )
                )
              )
          ).
          then((options) => {
            dirInfo.markdownlintOptions = options;
            return options &&
              options.config &&
              options.config.extends &&
              getJsoncParse().
                then(
                  (jsoncParse) => markdownlintExtendConfig(
                    options.config,
                    // Just needs to identify a file in the right directory
                    markdownlintCli2Jsonc,
                    [ jsoncParse, yamlParse ],
                    fs
                  )
                ).
                then((config) => {
                  options.config = config;
                });
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
                importOrRequireConfig(
                  fs,
                  dir,
                  ".markdownlint.cjs",
                  noRequire,
                  importOrRequireConfig(
                    fs,
                    dir,
                    ".markdownlint.mjs",
                    noRequire,
                    noop
                  )
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
  relativeDir,
  globPatterns,
  options,
  fixDefault,
  noGlobs,
  noRequire
) => {
  const tasks = [];
  const dirToDirInfo = {};
  getAndProcessDirInfo(
    fs,
    tasks,
    dirToDirInfo,
    baseDir,
    relativeDir,
    noRequire
  );
  await Promise.all(tasks);
  // eslint-disable-next-line no-multi-assign
  const baseMarkdownlintOptions = dirToDirInfo[baseDir].markdownlintOptions =
    mergeOptions(
      mergeOptions(
        { "fix": fixDefault },
        options
      ),
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

  return {
    baseMarkdownlintOptions,
    dirToDirInfo
  };
};

// Enumerate files from globs and build directory infos
const enumerateFiles =
  // eslint-disable-next-line max-len
  async (fs, baseDirSystem, baseDir, globPatterns, dirToDirInfo, noErrors, noRequire) => {
    const tasks = [];
    const globbyOptions = {
      "absolute": true,
      "cwd": baseDir,
      "dot": true,
      "expandDirectories": false,
      fs
    };
    if (noErrors) {
      globbyOptions.suppressErrors = true;
    }
    // Special-case literal files
    const literalFiles = [];
    const filteredGlobPatterns = globPatterns.filter(
      (globPattern) => {
        if (globPattern.startsWith(":")) {
          literalFiles.push(
            posixPath(path.resolve(baseDirSystem, globPattern.slice(1)))
          );
          return false;
        }
        return true;
      }
    ).map((globPattern) => globPattern.replace(/^\\:/u, ":"));
    const baseMarkdownlintOptions = dirToDirInfo[baseDir].markdownlintOptions;
    const globsForIgnore =
      (baseMarkdownlintOptions.globs || []).
        filter((glob) => glob.startsWith("!"));
    const filteredLiteralFiles =
      ((literalFiles.length > 0) && (globsForIgnore.length > 0))
        ? removeIgnoredFiles(baseDir, literalFiles, globsForIgnore)
        : literalFiles;
    // Manually expand directories to avoid globby call to dir-glob.sync
    const expandedDirectories = await Promise.all(
      filteredGlobPatterns.map((globPattern) => {
        const barePattern =
          globPattern.startsWith("!")
            ? globPattern.slice(1)
            : globPattern;
        const globPath =
          (path.posix.isAbsolute(barePattern) || path.isAbsolute(barePattern))
            ? barePattern
            : path.posix.join(baseDir, barePattern);
        return fs.promises.stat(globPath).
          then((stats) => (stats.isDirectory()
            ? path.posix.join(globPattern, "**")
            : globPattern)).
          catch(() => globPattern);
      })
    );
    // Process glob patterns
    // eslint-disable-next-line no-inline-comments
    const { globby } = await import(/* webpackMode: "eager" */ "globby");
    const files = [
      ...await globby(expandedDirectories, globbyOptions),
      ...filteredLiteralFiles
    ];
    for (const file of files) {
      const dir = path.posix.dirname(file);
      getAndProcessDirInfo(
        fs,
        tasks,
        dirToDirInfo,
        dir,
        null,
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
          null,
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
  async (fs, baseDirSystem, baseDir, globPatterns, dirToDirInfo, optionsOverride, noErrors, noRequire) => {
    await enumerateFiles(
      fs,
      baseDirSystem,
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
      // eslint-disable-next-line unicorn/consistent-function-scoping
      (dirInfo) => (
        dirInfo.parent &&
        !dirInfo.markdownlintConfig &&
        !dirInfo.markdownlintOptions
      );
    const tasks = [];
    for (const dir of dirs) {
      const dirInfo = dirToDirInfo[dir];
      if (noConfigDirInfo(dirInfo)) {
        if (dirInfo.parent) {
          appendToArray(dirInfo.parent.files, dirInfo.files);
        }
        dirToDirInfo[dir] = null;
      } else {
        const { markdownlintOptions, relativeDir } = dirInfo;
        if (markdownlintOptions && markdownlintOptions.customRules) {
          tasks.push(
            importOrRequireIds(
              relativeDir || dir,
              markdownlintOptions.customRules,
              noRequire
            ).then((customRules) => {
              // Expand nested arrays (for packages that export multiple rules)
              markdownlintOptions.customRules = customRules.flat();
            })
          );
        }
        if (markdownlintOptions && markdownlintOptions.markdownItPlugins) {
          tasks.push(
            importOrRequireIdsAndParams(
              relativeDir || dir,
              markdownlintOptions.markdownItPlugins,
              noRequire
            ).then((markdownItPlugins) => {
              markdownlintOptions.markdownItPlugins = markdownItPlugins;
            })
          );
        }
        dirInfos.push(dirInfo);
      }
    }
    await Promise.all(tasks);
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
    //     !((di.markdownlintConfig ? 1 : 0) ^ (di.markdownlintOptions ? 1 : 0))
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
const lintFiles = async (fs, dirInfos, fileContents) => {
  const jsoncParse = await getJsoncParse();
  const tasks = [];
  // For each dirInfo
  for (const dirInfo of dirInfos) {
    const { dir, files, markdownlintConfig, markdownlintOptions } = dirInfo;
    // Filter file/string inputs to only those in the dirInfo
    let filesAfterIgnores = files;
    if (
      markdownlintOptions.ignores &&
      (markdownlintOptions.ignores.length > 0)
    ) {
      // eslint-disable-next-line unicorn/no-array-callback-reference
      const ignores = markdownlintOptions.ignores.map(negateGlob);
      filesAfterIgnores = removeIgnoredFiles(dir, files, ignores);
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
      "configParsers": [ jsoncParse, yamlParse ],
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
const outputSummary = async (
  baseDir,
  relativeDir,
  summary,
  outputFormatters,
  logMessage,
  logError
) => {
  const errorsPresent = (summary.length > 0);
  if (errorsPresent || outputFormatters) {
    const formatterOptions = {
      "directory": baseDir,
      "results": summary,
      logMessage,
      logError
    };
    const dir = relativeDir || baseDir;
    const formattersAndParams = outputFormatters
      ? await importOrRequireIdsAndParams(dir, outputFormatters)
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
    noRequire,
    name
  } = params;
  const logMessage = params.logMessage || noop;
  const logError = params.logError || noop;
  const fs = params.fs || require("node:fs");
  const baseDirSystem =
    (directory && path.resolve(directory)) ||
    process.cwd();
  const baseDir = posixPath(baseDirSystem);
  // Output banner
  logMessage(
    // eslint-disable-next-line max-len
    `${name || packageName} v${packageVersion} (${libraryName} v${libraryVersion})`
  );
  // Read argv configuration file (if relevant and present)
  let optionsArgv = null;
  let relativeDir = null;
  const [ configPath ] = (argv || []);
  if ((name === "markdownlint-cli2-config") && configPath) {
    optionsArgv =
      await readOptionsOrConfig(configPath, fs, noRequire);
    relativeDir = path.dirname(configPath);
  }
  // Process arguments and get base options
  const globPatterns = processArgv(optionsArgv ? argv.slice(1) : argv);
  const { baseMarkdownlintOptions, dirToDirInfo } =
    await getBaseOptions(
      fs,
      baseDir,
      relativeDir,
      globPatterns,
      optionsArgv || optionsDefault,
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
      baseDirSystem,
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
    baseDir, relativeDir, summary, outputFormatters, logMessage, logError
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
