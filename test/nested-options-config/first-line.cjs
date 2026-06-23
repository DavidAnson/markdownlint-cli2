// @ts-check

"use strict";

const { deepFreeze } = require("../deep-freeze.cjs");

/** @type {import("markdownlint").Rule} */
// @ts-ignore
const rule = {
  "names": [ "first-line" ],
  "description": "Rule that reports an error for the first line",
  "tags": [ "test" ],
  "function": function rule(params, onError) {
    // Unconditionally report an error for line 1
    onError({
      "lineNumber": 1
    });
  }
};

module.exports = deepFreeze(rule);
