// @ts-check

"use strict";

const { deepFreeze } = require("../../deep-freeze.cjs");

/** @type {import("markdownlint").Rule} */
// @ts-ignore
const rule = {
  "names": [ "second-line" ],
  "description": "Rule that reports an error for the second line",
  "tags": [ "test" ],
  "asynchronous": true,
  "function": function rule(params, onError) {
    // Asynchronously report an error for line 2 (if present)
    return new Promise((resolve) => {
      if (params.lines.length >= 2) {
        onError({
          "lineNumber": 2
        });
      }
      // @ts-ignore
      resolve();
    });
  }
};

module.exports = deepFreeze(rule);
