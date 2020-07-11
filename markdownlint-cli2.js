#!/usr/bin/env node

// @ts-check

"use strict";

// Requires
const fs = require("fs").promises;
const path = require("path");
const util = require("util");
const globby = require("globby");
const markdownlint = require("markdownlint");

// Variables
const markdownlintPromise = util.promisify(markdownlint);
const markdownlintReadConfigPromise = util.promisify(markdownlint.readConfig);

// Parses JSONC text
const jsoncParse = (text) => JSON.parse(require("strip-json-comments")(text));

// Formats summary in the style of `markdownlint-cli`
const formatMarkdownlintCli = (summary) => {
  for (const errorInfo of summary) {
    const { fileName, lineNumber, ruleNames, ruleDescription, errorDetail,
      errorContext, errorRange } = errorInfo;
    const ruleName = ruleNames.join("/");
    const description = ruleDescription +
          (errorDetail ? ` [${errorDetail}]` : "") +
          (errorContext ? ` [Context: "${errorContext}"]` : "");
    const column = (errorRange && errorRange[0]) || 0;
    const columnText = column ? `:${column}` : "";
    console.error(
      `${fileName}:${lineNumber}${columnText} ${ruleName} ${description}`
    );
  }
};

// Main function
(async () => {
  const dirInfos = {};
  const tasks = [];

  // Output help for missing arguments
  const globPatterns =
    process.
      argv.
      slice(2).
      map((glob) => glob.replace(/^#/u, "!"));
  if (globPatterns.length === 0) {
    const { name, version, author, homepage } = require("./package.json");
    /* eslint-disable max-len */
    console.log(`${name} version ${version} by ${author}
${homepage}

Syntax: ${name} glob0 [glob1] [...] [globN]

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
    process.exitCode = 1;
  }

  // Enumerate glob patterns and build directory info list
  const configFileNameAndPropertys = [
    [
      ".markdownlint.json",
      "markdownlintJson",
      // @ts-ignore
      (file) => markdownlintReadConfigPromise(file, [ jsoncParse ]),
      (result) => result
    ],
    [
      ".markdownlint-cli2.jsonc",
      "markdownlintCli2Jsonc",
      (file) => fs.readFile(file, "utf8"),
      jsoncParse
    ]
  ];
  const getAndProcessDirInfo = (dir, func) => {
    let dirInfo = dirInfos[dir];
    if (!dirInfo) {
      dirInfo = {
        "parent": null,
        "files": [],
        "markdownlintJson": null,
        "markdownlintCli2Jsonc": null
      };
      dirInfos[dir] = dirInfo;
      for (const config of configFileNameAndPropertys) {
        const [ configFile, configProperty, readFile, convertResult ] = config;
        // @ts-ignore
        const configPath = path.join(dir, configFile);
        const task = fs.access(configPath).
          then(
            // @ts-ignore
            () => readFile(configPath).
              then((result) => {
                // @ts-ignore
                dirInfo[configProperty] = convertResult(result);
              }),
            () => {
              // Ignore failure
            }
          );
        tasks.push(task);
      }
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
  const noConfigDirInfo =
    (dirInfo) => (
      dirInfo.parent &&
      !dirInfo.markdownlintJson &&
      !dirInfo.markdownlintCli2Jsonc
    );
  for (const dir in dirInfos) {
    const dirInfo = dirInfos[dir];
    if (noConfigDirInfo(dirInfo)) {
      let targetChild = dirInfo;
      while (noConfigDirInfo(targetChild.parent)) {
        targetChild = targetChild.parent;
      }
      targetChild.parent.files.push(...dirInfo.files);
      delete dirInfos[dir];
    }
  }

  // Merge configuration by inheritance
  for (const dir in dirInfos) {
    const dirInfo = dirInfos[dir];
    let markdownlintCli2Jsonc = dirInfo.markdownlintCli2Jsonc || {};
    let parent = dirInfo;
    // eslint-disable-next-line prefer-destructuring
    while ((parent = parent.parent)) {
      if (parent.markdownlintCli2Jsonc) {
        const config = {
          ...parent.markdownlintCli2Jsonc.config,
          ...markdownlintCli2Jsonc.config
        };
        markdownlintCli2Jsonc = {
          ...parent.markdownlintCli2Jsonc,
          ...markdownlintCli2Jsonc,
          config
        };
      }
    }
    dirInfo.markdownlintCli2Jsonc = markdownlintCli2Jsonc;
  }

  // Lint each list of files
  for (const dir in dirInfos) {
    const dirInfo = dirInfos[dir];
    delete dirInfo.parent;
    const options = {
      ...dirInfo.markdownlintCli2Jsonc,
      "files": dirInfo.files,
      "resultVersion": 3
    };
    if (dirInfo.markdownlintJson) {
      options.config = dirInfo.markdownlintJson;
    }
    const task = markdownlintPromise(options);
    tasks.push(task);
  }
  const taskResults = await Promise.all(tasks);
  tasks.length = 0;

  // Create summary of results
  const cwd = process.cwd();
  const summary = [];
  let counter = 0;
  for (const results of taskResults) {
    for (const fileName in results) {
      const errorInfos = results[fileName];
      if (Array.isArray(errorInfos)) {
        for (const errorInfo of errorInfos) {
          summary.push({
            "fileName": path.posix.relative(cwd, fileName),
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
    formatMarkdownlintCli(summary);
    process.exitCode = 1;
  }
})();
