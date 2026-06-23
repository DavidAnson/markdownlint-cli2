// @ts-check

"use strict";

const { deepFreeze } = require("../../deep-freeze.cjs");

/** @type {import("markdownlint").Rule} */
// @ts-ignore
const rule = {
  "names": [ "throws" ],
  "description": "Rule that throws during execution",
  "tags": [ "test" ],
  "function": function rule(params, onError) {
    throw new Error("Simulated bug");
  }
};

module.exports = deepFreeze(rule);
