// @ts-check

"use strict";

const anyBlockquote = require("./rules/any-blockquote.cjs");
const { deepFreeze } = require("../deep-freeze.cjs");

module.exports = deepFreeze({
  "customRules": [
    anyBlockquote,
  ],
});

