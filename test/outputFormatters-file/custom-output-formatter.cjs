// @ts-check

"use strict";

module.exports = (options, params) => {
  const { logMessage, results } = options;
  for (const result of results) {
    const { fileName, lineNumber, ruleNames } = result;
    logMessage(`${fileName} ${lineNumber} ${ruleNames.join("/")}`);
  }
};
