// @ts-check

"use strict";

const { styleText } = require("node:util");

/** @typedef {import("../markdownlint-cli2.mjs").OutputFormatterOptions} OutputFormatterOptions */

/**
 * @typedef {object} Parameters
 * @property {boolean} appendLink Whether to append (vs. embed) links.
 */

// Formats markdownlint-cli2 results in the style of `markdownlint-cli` with
// color and clickable links
const outputFormatter = async (/** @type {OutputFormatterOptions} */ options, /** @type {Parameters} */ params) => {
  const { results, logError } = options;
  const { appendLink } = (params || {});
  const { "default": terminalLink } = await import("terminal-link");
  for (const errorInfo of results) {
    const { fileName, lineNumber, ruleNames, ruleDescription, ruleInformation, errorDetail, errorContext, errorRange, severity } = errorInfo;
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
      styleText("magenta", fileName) +
      styleText("cyan", ":") +
      styleText("green", String(lineNumber)) +
      (column ? styleText("cyan", ":") + styleText("green", String(column)) : "") +
      " " +
      (severity ? `${styleText("gray", severity)} ` : "") +
      styleText("yellow", ruleText) +
      " " +
      ruleDescription +
      styleText("yellow", detailsAndContext) +
      (appendText.length > 0 ? styleText("blueBright", appendText) : "")
    );
  }
};

module.exports = outputFormatter;
