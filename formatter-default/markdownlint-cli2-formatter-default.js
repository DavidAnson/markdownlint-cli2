// @ts-check

"use strict";

/** @typedef {import("../markdownlint-cli2.mjs").OutputFormatterOptions} OutputFormatterOptions */

// Formats markdownlint-cli2 results in the style of `markdownlint-cli`
const outputFormatter = (/** @type {OutputFormatterOptions} */ options) => {
  const { results, logError } = options;
  for (const errorInfo of results) {
    const { fileName, lineNumber, ruleNames, ruleDescription, errorDetail, errorContext, errorRange } = errorInfo;
    const ruleName = ruleNames.join("/");
    const description = ruleDescription +
      (errorDetail ? ` [${errorDetail}]` : "") +
      (errorContext ? ` [Context: "${errorContext}"]` : "");
    const column = (errorRange && errorRange[0]) || 0;
    const columnText = column ? `:${column}` : "";
    logError(`${fileName}:${lineNumber}${columnText} ${ruleName} ${description}`);
  }
  return Promise.resolve();
};

module.exports = outputFormatter;
