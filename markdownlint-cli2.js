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

// Variables
const markdownlintPromise = util.promisify(markdownlint);
const markdownlintReadConfigPromise = util.promisify(markdownlint.readConfig);
const crlfRe = /\r\n?|\n/gu;
const utf8 = "utf8";

// Parse JSONC text
const jsoncParse = (text) => JSON.parse(require("strip-json-comments")(text));

// Parse YAML text
const yamlParse = (text) => require("yaml").parse(text);

// Formats summary in the style of `markdownlint-cli`
const formatMarkdownlintCli = (summary, logError) => {
  for (const errorInfo of summary) {
    const { fileName, lineNumber, ruleNames, ruleDescription, errorDetail,
      errorContext, errorRange } = errorInfo;
    const ruleName = ruleNames.join("/");
    const description = ruleDescription +
          (errorDetail ? ` [${errorDetail}]` : "") +
          (errorContext ? ` [Context: "${errorContext}"]` : "");
    const column = (errorRange && errorRange[0]) || 0;
    const columnText = column ? `:${column}` : "";
    logError(
      `${fileName}:${lineNumber}${columnText} ${ruleName} ${description}`
    );
  }
};

// Main function
const main = async (argv, logMessage, logError) => {
  // Output help for missing arguments
  const globPatterns =
    argv.
      map((glob) => glob.replace(/^#/u, "!"));
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

Configuration:
- Via .markdownlint-cli2.jsonc, .markdownlint.jsonc, .markdownlint.json, .markdownlint.yaml, or .markdownlint.yml

Cross-platform compatibility:
- UNIX and Windows shells expand globs according to different rules, so quoting glob arguments is recommended
- Shells that expand globs do not support negated patterns (!node_modules), so quoting negated globs is required
- Some Windows shells do not handle single-quoted (') arguments correctly, so double-quotes (") are recommended
- Some UNIX shells handle exclamation (!) in double-quotes specially, so hashtag (#) is recommended for negated globs
- Some shells use backslash (\\) to escape special characters, so forward slash (/) is the recommended path separator

Therefore, the most compatible syntax for cross-platform support:
${name} "**/*.md" "#node_modules"`
    );
    /* eslint-enable max-len */
    return 1;
  }

  // Read ignore globs to pass as globby patterns
  const markdownlintIgnore = ".markdownlintignore";
  await fs.access(markdownlintIgnore).
    then(
      () => fs.readFile(markdownlintIgnore, utf8).
        then(
          (content) => {
            const blankOrCommentRe = /^#|^\s*$/u;
            const ignorePatterns = content.
              split(crlfRe).
              filter((line) => !blankOrCommentRe.test(line)).
              map((glob) => `!${glob.trim()}`);
            globPatterns.push(...ignorePatterns);
          }
        ),
      () => null
    );

  // Enumerate glob patterns and build directory info list
  const tasks = [];
  const dirToDirInfo = {};
  const readConfig = (dir, name, otherwise) => {
    const file = path.join(dir, name);
    return () => fs.access(file).
      then(
        // @ts-ignore
        () => markdownlintReadConfigPromise(file, [ jsoncParse, yamlParse ]),
        otherwise
      );
  };
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
      tasks.push(
        fs.access(markdownlintCli2Jsonc).
          then(
            () => fs.readFile(markdownlintCli2Jsonc, utf8).then(jsoncParse),
            () => null
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
                () => null
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
    func(dirInfo);
    return dirInfo;
  };
  for await (const file of globby.stream(globPatterns)) {
    // @ts-ignore
    let dir = path.dirname(file);
    let lastDir = dir;
    let lastDirInfo = getAndProcessDirInfo(dir, (dirInfo) => {
      dirInfo.files.push(file);
    });
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
        dirInfo.parent.files.push(...dirInfo.files);
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
  // if (dirInfos.filter((di) => !di.files.length).length) {
  //   throw new Error("No files");
  // }
  // if (dirInfos.filter(
  //   (di) => di.parent && !dirInfos.includes(di.parent)).length
  // ) {
  //   throw new Error("Extra parent");
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
  for (const dirInfo of dirInfos) {
    const { files, markdownlintConfig, markdownlintOptions } = dirInfo;
    const frontMatter = markdownlintOptions.frontMatter
      ? new RegExp(markdownlintOptions.frontMatter, "u")
      : undefined;
    const options = {
      files,
      "config":
        markdownlintConfig || markdownlintOptions.config,
      frontMatter,
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

  // Output summary
  if (summary.length > 0) {
    formatMarkdownlintCli(summary, logError);
    return 1;
  }

  // Success
  return 0;
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
