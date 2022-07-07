// @ts-check

"use strict";

module.exports = (options, params) => {
  const { logError, results } = options;
  for (const result of results) {
    const { fileName, lineNumber, ruleNames } = result;
    logError(`${fileName} ${lineNumber} ${ruleNames.join("/")}`);
  }
};
