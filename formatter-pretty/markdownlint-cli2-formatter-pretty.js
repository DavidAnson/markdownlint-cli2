// @ts-check

"use strict";

// Formats markdownlint-cli2 results in the style of `markdownlint-cli` with
// color and clickable links
const outputFormatter = async (options, params) => {
  const { results, logError } = options;
  const { appendLink, colors } = (params || {});
  const {
    fileName: fileNameColor = "magenta",
    separator: separatorColor = "cyan",
    lineNumber: lineNumberColor = "green",
    column: columnColor = "green",
    ruleText: ruleTextColor = "gray",
    ruleDescription: ruleDescriptionColor = "whiteBright",
    detailsAndContext: detailsAndContextColor = "gray",
    appendText: appendTextColor = "blueBright"
  } = colors;
  const { "default": chalk } = await import("chalk");
  const { "default": terminalLink } = await import("terminal-link");
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
      chalk[fileNameColor](fileName) +
      chalk[separatorColor](":") +
      chalk[lineNumberColor](lineNumber) +
      (column ? chalk[separatorColor](":") + chalk[columnColor](column) : "") +
      " " +
      chalk[ruleTextColor](ruleText) +
      " " +
      chalk[ruleDescriptionColor](ruleDescription) +
      chalk[detailsAndContextColor](detailsAndContext) +
      (appendText.length > 0 ? chalk[appendTextColor](appendText) : "")
    );
  }
};

module.exports = outputFormatter;
