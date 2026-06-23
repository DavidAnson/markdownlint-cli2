// @ts-check

"use strict";

const { deepFreeze } = require("../../deep-freeze.cjs");

module.exports = deepFreeze({
  "extends": "base.jsonc",
  "no-trailing-spaces": false,
  "no-multiple-space-atx": false,
  "single-trailing-newline": false
});
