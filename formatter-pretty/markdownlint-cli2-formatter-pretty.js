// @ts-check

"use strict";

const chalk = require("chalk");
const terminalLink = require("terminal-link");

// Formats markdownlint-cli2 results in the style of `markdownlint-cli` with
// color and clickable links
const outputFormatter = (options, params) => {
  const { results, logError } = options;
  const { appendLink } = (params || {});
  for (const errorInfo of results) {
    const { fileName, lineNumber, ruleNames, ruleDescription, ruleInformation,
      errorDetail, errorContext, errorRange } = errorInfo;
    const ruleName = ruleNames.join("/");
    const ruleText = ruleInformation
      ? terminalLink.stderr(ruleName, ruleInformation, { "fallback": false })
      : ruleName;
    const detailsAndContext =
          (errorDetail ? ` [${errorDetail}]` : "") +
          (errorContext ? ` [Context: "${errorContext}"]` : "");
    const appendText = appendLink && ruleInformation
      ? ` ${ruleInformation}`
      : "";
    const column = (errorRange && errorRange[0]) || 0;
    logError(
      // eslint-disable-next-line prefer-template
      chalk.magenta(fileName) +
      chalk.cyan(":") +
      chalk.green(lineNumber) +
      (column ? chalk.cyan(":") + chalk.green(column) : "") +
      " " +
      chalk.gray(ruleText) +
      " " +
      ruleDescription +
      chalk.gray(detailsAndContext) +
      (appendText.length > 0 ? chalk.blueBright(appendText) : "")
    );
  }
  return Promise.resolve();
};

module.exports = outputFormatter;
