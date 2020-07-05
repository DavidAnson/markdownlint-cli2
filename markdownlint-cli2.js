// @ts-check

"use strict";

// Requires
const fs = require("fs").promises;
const path = require("path");
const util = require("util");
const globby = require("globby");
const markdownlint = require("markdownlint");
const stripJsonComments = require("strip-json-comments");

// Variables
const markdownlintPromise = util.promisify(markdownlint);

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
  const globPatterns = process.argv.slice(2);
  if (!globPatterns.length) {
    const program = path.basename(process.argv[1], ".js");
    console.log(`SYNTAX: ${program} 'glob0' ['glob1'] [...] ['globN']`);
    console.log(
      "NOTE: Use single quotes to wrap glob patterns for best performance"
    );
    console.log(
      "      Single quote wrapping is necessary for negated ('!') patterns"
    );
    console.log(`EXAMPLE: ${program} '**/*.md' '!node_modules'`);
    process.exitCode = 1;
  }

  // Enumerate glob patterns and build directory info list
  const configFileNameAndPropertys = [
    [ ".markdownlint.json", "markdownlintJson" ],
    [ ".markdownlint-cli2.jsonc", "markdownlintCli2Jsonc" ]
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
        const [ configFile, configProperty ] = config;
        const configPath = path.join(dir, configFile);
        const task = fs.access(configPath).
          then(
            () => fs.readFile(configPath, "utf8").
              then((content) => {
                dirInfo[configProperty] =
                  JSON.parse(stripJsonComments(content));
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
  const summary = [];
  let counter = 0;
  for (const results of taskResults) {
    for (const fileName in results) {
      const errorInfos = results[fileName];
      if (Array.isArray(errorInfos)) {
        for (const errorInfo of errorInfos) {
          summary.push({
            fileName,
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
  if (summary.length) {
    formatMarkdownlintCli(summary);
    process.exitCode = 1;
  }
})();
