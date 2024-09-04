#!/usr/bin/env node

// @ts-check

"use strict";

// @ts-ignore
// eslint-disable-next-line camelcase, no-inline-comments, no-undef
const dynamicRequire = (typeof __non_webpack_require__ === "undefined") ? require : /* c8 ignore next */ __non_webpack_require__;
// Capture native require implementation for dynamic loading of modules

// Requires
const pathDefault = require("node:path");
const pathPosix = pathDefault.posix;
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
const packageVersion = "0.13.0";
const libraryName = "markdownlint";
const libraryVersion = markdownlintLibrary.getVersion();
const bannerMessage = `${packageName} v${packageVersion} (${libraryName} v${libraryVersion})`;
const dotOnlySubstitute = "*.{md,markdown}";
const utf8 = "utf8";

// No-op function
const noop = () => null;

// Gets a JSONC parser
const getJsoncParse = () => require("./parsers/jsonc-parse.js");

// Gets a YAML parser
const getYamlParse = () => require("./parsers/yaml-parse.js");

// Gets an ordered array of parsers
const getParsers = () => require("./parsers/parsers.js");

// Negates a glob
const negateGlob = (glob) => `!${glob}`;

// Throws a meaningful exception for an unusable configuration file
const throwForConfigurationFile = (file, error) => {
  throw new Error(
    `Unable to use configuration file '${file}'; ${error?.message}`,
    // @ts-ignore
    { "cause": error }
  );
};

// Return a posix path (even on Windows)
const posixPath = (p) => p.split(pathDefault.sep).join(pathPosix.sep);

// Expands a path with a tilde to an absolute path
const expandTildePath = (id) => (
  markdownlintRuleHelpers.expandTildePath(id, require("node:os"))
);

// Resolves module paths relative to the specified directory
const resolveModulePaths = (dir, modulePaths) => (
  modulePaths.map((path) => pathDefault.resolve(dir, expandTildePath(path)))
);

// Read a JSON(C) or YAML file and return the object
const readConfig = (fs, dir, name, otherwise) => () => {
  const file = pathPosix.join(dir, name);
  return fs.promises.access(file).
    then(
      () => markdownlintReadConfig(
        file,
        getParsers(),
        fs
      ),
      otherwise
    );
};

// Import or resolve/require a module ID with a custom directory in the path
const importOrRequireResolve = async (dirOrDirs, id, noRequire) => {
  if (typeof id === "string") {
    if (noRequire) {
      return null;
    }
    const dirs = Array.isArray(dirOrDirs) ? dirOrDirs : [ dirOrDirs ];
    const expandId = expandTildePath(id);
    const errors = [];
    try {
      return resolveAndRequire(dynamicRequire, expandId, dirs);
    } catch (error) {
      errors.push(error);
    }
    try {
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      const isURL = !pathDefault.isAbsolute(expandId) && URL.canParse(expandId);
      const urlString = (
        isURL ? new URL(expandId) : pathToFileURL(pathDefault.resolve(dirs[0], expandId))
      ).toString();
      // eslint-disable-next-line no-inline-comments
      const module = await import(/* webpackIgnore: true */ urlString);
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
const importOrRequireIds = (dirs, ids, noRequire) => (
  Promise.all(
    ids.map(
      (id) => importOrRequireResolve(dirs, id, noRequire)
    )
  ).then((results) => results.filter(Boolean))
);

// Import or require an array of modules by ID (preserving parameters)
const importOrRequireIdsAndParams = (dirs, idsAndParams, noRequire) => (
  Promise.all(
    idsAndParams.map(
      (idAndParams) => importOrRequireResolve(dirs, idAndParams[0], noRequire).
        then((module) => module && [ module, ...idAndParams.slice(1) ])
    )
  ).then((results) => results.filter(Boolean))
);

// Import or require a JavaScript file and return the exported object
const importOrRequireConfig = (fs, dir, name, noRequire, otherwise) => () => {
  const file = pathPosix.join(dir, name);
  return fs.promises.access(file).
    then(
      () => importOrRequireResolve(dir, name, noRequire),
      otherwise
    );
};

// Extend a config object if it has 'extends' property
const getExtendedConfig = (config, configPath, fs) => {
  if (config.extends) {
    return markdownlintExtendConfig(
      config,
      configPath,
      getParsers(),
      fs
    );
  }

  return Promise.resolve(config);
};

// Read an options or config file in any format and return the object
const readOptionsOrConfig = async (configPath, fs, noRequire) => {
  const basename = pathPosix.basename(configPath);
  const dirname = pathPosix.dirname(configPath);
  let options = null;
  let config = null;
  try {
    if (basename.endsWith(".markdownlint-cli2.jsonc")) {
      options = getJsoncParse()(await fs.promises.readFile(configPath, utf8));
    } else if (basename.endsWith(".markdownlint-cli2.yaml")) {
      options = getYamlParse()(await fs.promises.readFile(configPath, utf8));
    } else if (
      basename.endsWith(".markdownlint-cli2.cjs") ||
      basename.endsWith(".markdownlint-cli2.mjs")
    ) {
      options = await importOrRequireResolve(dirname, basename, noRequire);
    } else if (
      basename.endsWith(".markdownlint.jsonc") ||
      basename.endsWith(".markdownlint.json") ||
      basename.endsWith(".markdownlint.yaml") ||
      basename.endsWith(".markdownlint.yml")
    ) {
      config = await markdownlintReadConfig(configPath, getParsers(), fs);
    } else if (
      basename.endsWith(".markdownlint.cjs") ||
      basename.endsWith(".markdownlint.mjs")
    ) {
      config = await importOrRequireResolve(dirname, basename, noRequire);
    } else {
      throw new Error(
        "File name should be (or end with) one of the supported types " +
        "(e.g., '.markdownlint.json' or 'example.markdownlint-cli2.jsonc')."
      );
    }
  } catch (error) {
    throwForConfigurationFile(configPath, error);
  }
  if (options) {
    if (options.config) {
      options.config = await getExtendedConfig(options.config, configPath, fs);
    }
    return options;
  }
  config = await getExtendedConfig(config, configPath, fs);
  return { config };
};

// Filter a list of files to ignore by glob
const removeIgnoredFiles = (dir, files, ignores) => {
  const micromatch = require("micromatch");
  return micromatch(
    files.map((file) => pathPosix.relative(dir, file)),
    ignores
  ).map((file) => pathPosix.join(dir, file));
};

// Process/normalize command-line arguments and return glob patterns
const processArgv = (argv) => {
  const globPatterns = argv.map(
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
const showHelp = (logMessage, showBanner) => {
  if (showBanner) {
    logMessage(bannerMessage);
  }
  logMessage(`https://github.com/DavidAnson/markdownlint-cli2

Syntax: markdownlint-cli2 glob0 [glob1] [...] [globN] [--config file] [--fix] [--help]

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

Optional parameters:
- --config    specifies the path to a configuration file to define the base configuration
- --fix       updates files to resolve fixable issues (can be overridden in configuration)
- --help      writes this message to the console and exits without doing anything else
- --no-globs  ignores the "globs" property if present in the top-level options object

Configuration via:
- .markdownlint-cli2.jsonc
- .markdownlint-cli2.yaml
- .markdownlint-cli2.cjs or .markdownlint-cli2.mjs
- .markdownlint.jsonc or .markdownlint.json
- .markdownlint.yaml or .markdownlint.yml
- .markdownlint.cjs or .markdownlint.mjs
- package.json

Cross-platform compatibility:
- UNIX and Windows shells expand globs according to different rules; quoting arguments is recommended
- Some Windows shells don't handle single-quoted (') arguments well; double-quote (") is recommended
- Shells that expand globs do not support negated patterns (!node_modules); quoting is required here
- Some UNIX shells parse exclamation (!) in double-quotes; hashtag (#) is recommended in these cases
- The path separator is forward slash (/) on all platforms; backslash (\\) is automatically converted
- On any platform, passing the parameter "--" causes all remaining parameters to be treated literally

The most compatible syntax for cross-platform support:
$ markdownlint-cli2 "**/*.md" "#node_modules"`
  );
  return 2;
};

// Get (creating if necessary) and process a directory's info object
const getAndProcessDirInfo = (
  fs,
  tasks,
  dirToDirInfo,
  dir,
  relativeDir,
  noRequire,
  allowPackageJson
) => {
  // Create dirInfo
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
    const markdownlintCli2Jsonc = pathPosix.join(dir, ".markdownlint-cli2.jsonc");
    const markdownlintCli2Yaml = pathPosix.join(dir, ".markdownlint-cli2.yaml");
    const markdownlintCli2Cjs = pathPosix.join(dir, ".markdownlint-cli2.cjs");
    const markdownlintCli2Mjs = pathPosix.join(dir, ".markdownlint-cli2.mjs");
    const packageJson = pathPosix.join(dir, "package.json");
    let file = "[UNKNOWN]";
    // eslint-disable-next-line no-return-assign
    const captureFile = (f) => file = f;
    tasks.push(
      fs.promises.access(captureFile(markdownlintCli2Jsonc)).
        then(
          () => fs.promises.readFile(file, utf8).then(getJsoncParse()),
          () => fs.promises.access(captureFile(markdownlintCli2Yaml)).
            then(
              () => fs.promises.readFile(file, utf8).then(getYamlParse()),
              () => fs.promises.access(captureFile(markdownlintCli2Cjs)).
                then(
                  () => importOrRequireResolve(dir, file, noRequire),
                  () => fs.promises.access(captureFile(markdownlintCli2Mjs)).
                    then(
                      () => importOrRequireResolve(dir, file, noRequire),
                      () => (allowPackageJson
                        ? fs.promises.access(captureFile(packageJson))
                        // eslint-disable-next-line prefer-promise-reject-errors
                        : Promise.reject()
                      ).
                        then(
                          () => fs.promises.
                            readFile(file, utf8).
                            then(getJsoncParse()).
                            then((obj) => obj[packageName]),
                          noop
                        )
                    )
                )
            )
        ).
        then((options) => {
          dirInfo.markdownlintOptions = options;
          return options &&
            options.config &&
            getExtendedConfig(
              options.config,
              // Just need to identify a file in the right directory
              markdownlintCli2Jsonc,
              fs
            ).
              then((config) => {
                options.config = config;
              });
        }).
        catch((error) => {
          throwForConfigurationFile(file, error);
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

  // Return dirInfo
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
    noRequire,
    true
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
const enumerateFiles = async (
  fs,
  baseDirSystem,
  baseDir,
  globPatterns,
  dirToDirInfo,
  gitignore,
  ignoreFiles,
  noRequire
) => {
  const tasks = [];
  /** @type {import("globby").Options} */
  const globbyOptions = {
    "absolute": true,
    "cwd": baseDir,
    "dot": true,
    "expandDirectories": false,
    gitignore,
    ignoreFiles,
    "suppressErrors": true,
    fs
  };
  // Special-case literal files
  const literalFiles = [];
  const filteredGlobPatterns = globPatterns.filter(
    (globPattern) => {
      if (globPattern.startsWith(":")) {
        literalFiles.push(
          posixPath(pathDefault.resolve(baseDirSystem, globPattern.slice(1)))
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
      const globPath = (
        pathPosix.isAbsolute(barePattern) ||
        pathDefault.isAbsolute(barePattern)
      )
        ? barePattern
        : pathPosix.join(baseDir, barePattern);
      return fs.promises.stat(globPath).
        then((stats) => (stats.isDirectory()
          ? pathPosix.join(globPattern, "**")
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
    const dir = pathPosix.dirname(file);
    const dirInfo = getAndProcessDirInfo(
      fs,
      tasks,
      dirToDirInfo,
      dir,
      null,
      noRequire,
      false
    );
    dirInfo.files.push(file);
  }
  await Promise.all(tasks);
};

// Enumerate (possibly missing) parent directories and update directory infos
const enumerateParents = async (
  fs,
  baseDir,
  dirToDirInfo,
  noRequire
) => {
  const tasks = [];

  // Create a lookup of baseDir and parents
  const baseDirParents = {};
  let baseDirParent = baseDir;
  do {
    baseDirParents[baseDirParent] = true;
    baseDirParent = pathPosix.dirname(baseDirParent);
  } while (!baseDirParents[baseDirParent]);

  // Visit parents of each dirInfo
  for (let lastDirInfo of Object.values(dirToDirInfo)) {
    let { dir } = lastDirInfo;
    let lastDir = dir;
    while (
      !baseDirParents[dir] &&
      (dir = pathPosix.dirname(dir)) &&
      (dir !== lastDir)
    ) {
      lastDir = dir;
      const dirInfo =
        getAndProcessDirInfo(
          fs,
          tasks,
          dirToDirInfo,
          dir,
          null,
          noRequire,
          false
        );
      lastDirInfo.parent = dirInfo;
      lastDirInfo = dirInfo;
    }

    // If dir not under baseDir, inject it as parent for configuration
    if (dir !== baseDir) {
      dirToDirInfo[dir].parent = dirToDirInfo[baseDir];
    }
  }
  await Promise.all(tasks);
};

// Create directory info objects by enumerating file globs
const createDirInfos = async (
  fs,
  baseDirSystem,
  baseDir,
  globPatterns,
  dirToDirInfo,
  optionsOverride,
  gitignore,
  ignoreFiles,
  noRequire
) => {
  await enumerateFiles(
    fs,
    baseDirSystem,
    baseDir,
    globPatterns,
    dirToDirInfo,
    gitignore,
    ignoreFiles,
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
      const effectiveDir = relativeDir || dir;
      const effectiveModulePaths = resolveModulePaths(
        effectiveDir,
        (markdownlintOptions && markdownlintOptions.modulePaths) || []
      );
      if (markdownlintOptions && markdownlintOptions.customRules) {
        tasks.push(
          importOrRequireIds(
            [ effectiveDir, ...effectiveModulePaths ],
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
            [ effectiveDir, ...effectiveModulePaths ],
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
const lintFiles = (fs, dirInfos, fileContents) => {
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
      "configParsers": getParsers(),
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
        const fileNameRelative = pathPosix.relative(baseDir, fileName);
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
  modulePaths,
  logMessage,
  logError,
  noRequire
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
    const dirs = [ dir, ...modulePaths ];
    const formattersAndParams = outputFormatters
      ? await importOrRequireIdsAndParams(dirs, outputFormatters, noRequire)
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
    fileContents,
    nonFileContents,
    noRequire
  } = params;
  let {
    noGlobs
  } = params;
  const logMessage = params.logMessage || noop;
  const logError = params.logError || noop;
  const fs = params.fs || require("node:fs");
  const baseDirSystem =
    (directory && pathDefault.resolve(directory)) ||
    process.cwd();
  const baseDir = posixPath(baseDirSystem);
  // Merge and process args/argv
  let fixDefault = false;
  // eslint-disable-next-line unicorn/no-useless-undefined
  let configPath = undefined;
  let sawDashDash = false;
  let shouldShowHelp = false;
  const argvFiltered = (argv || []).filter((arg) => {
    if (sawDashDash) {
      return true;
    } else if (configPath === null) {
      configPath = arg;
      // eslint-disable-next-line unicorn/prefer-switch
    } else if (arg === "--") {
      sawDashDash = true;
    } else if (arg === "--config") {
      configPath = null;
    } else if (arg === "--fix") {
      fixDefault = true;
    } else if (arg === "--help") {
      shouldShowHelp = true;
    } else if (arg === "--no-globs") {
      noGlobs = true;
    } else {
      return true;
    }
    return false;
  });
  if (shouldShowHelp) {
    return showHelp(logMessage, true);
  }
  // Read argv configuration file (if relevant and present)
  let optionsArgv = null;
  let relativeDir = null;
  let globPatterns = null;
  let baseOptions = null;
  try {
    if (configPath) {
      const resolvedConfigPath =
        posixPath(pathDefault.resolve(baseDirSystem, configPath));
      optionsArgv =
        await readOptionsOrConfig(resolvedConfigPath, fs, noRequire);
      relativeDir = pathPosix.dirname(resolvedConfigPath);
    }
    // Process arguments and get base options
    globPatterns = processArgv(argvFiltered);
    baseOptions = await getBaseOptions(
      fs,
      baseDir,
      relativeDir,
      globPatterns,
      optionsArgv || optionsDefault,
      fixDefault,
      noGlobs,
      noRequire
    );
  } finally {
    if (!baseOptions?.baseMarkdownlintOptions.noBanner) {
      logMessage(bannerMessage);
    }
  }
  if (
    ((globPatterns.length === 0) && !nonFileContents) ||
    (configPath === null)
  ) {
    return showHelp(logMessage, false);
  }
  // Include any file overrides or non-file content
  const { baseMarkdownlintOptions, dirToDirInfo } = baseOptions;
  const resolvedFileContents = {};
  for (const file in fileContents) {
    const resolvedFile = posixPath(pathDefault.resolve(baseDirSystem, file));
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
  const gitignore =
    // https://github.com/sindresorhus/globby/issues/265
    (!params.fs && (baseMarkdownlintOptions.gitignore === true));
  const ignoreFiles =
    (!params.fs && (typeof baseMarkdownlintOptions.gitignore === "string"))
      ? baseMarkdownlintOptions.gitignore
      : undefined;
  const dirInfos =
    await createDirInfos(
      fs,
      baseDirSystem,
      baseDir,
      globPatterns,
      dirToDirInfo,
      optionsOverride,
      gitignore,
      ignoreFiles,
      noRequire
    );
  // Output linting status
  if (showProgress) {
    const fileNames = dirInfos.flatMap((dirInfo) => {
      const { files } = dirInfo;
      return files.map((file) => pathPosix.relative(baseDir, file));
    });
    const fileCount = fileNames.length;
    if (baseMarkdownlintOptions.showFound) {
      fileNames.push("");
      fileNames.sort();
      logMessage(`Found:${fileNames.join("\n ")}`);
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
  const modulePaths = resolveModulePaths(
    baseDir,
    baseMarkdownlintOptions.modulePaths || []
  );
  const errorsPresent = await outputSummary(
    baseDir,
    relativeDir,
    summary,
    outputFormatters,
    modulePaths,
    logMessage,
    logError,
    noRequire
  );
  // Return result
  return errorsPresent ? 1 : 0;
};

// Run function
const run = (overrides, args) => {
  (async () => {
    const argsAndArgv = args || [];
    appendToArray(argsAndArgv, process.argv.slice(2));
    try {
      const defaultParams = {
        "argv": argsAndArgv,
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
