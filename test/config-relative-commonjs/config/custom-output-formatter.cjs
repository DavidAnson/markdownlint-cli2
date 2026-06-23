// @ts-check

"use strict";

const { deepFreeze } = require("../../deep-freeze.cjs");

/** @type {import("markdownlint-cli2").OutputFormatter} */
const formatter = (options) => {
  const { logError, results } = options;
  for (const result of results) {
    const { fileName, lineNumber, ruleNames } = result;
    logError(`${fileName} ${lineNumber} ${ruleNames.join("/")}`);
  }
};

const frozenFormatter = deepFreeze(formatter);

module.exports = frozenFormatter;
