// @ts-check

"use strict";

const { deepFreeze } = require("../../deep-freeze.cjs");

/** @type {import("markdownlint").Rule} */
// @ts-ignore
const rule = {
  "names": [ "every-n-lines" ],
  "description": "Rule that reports an error every N lines",
  "tags": [ "test" ],
  "function": (params, onError) => {
    const n = params.config.n || 2;
    for (let lineNumber = n; lineNumber <= params.lines.length; lineNumber += n) {
      onError({
        lineNumber,
        "detail": `Line number ${lineNumber}`
      });
    }
  }
};

module.exports = deepFreeze(rule);
