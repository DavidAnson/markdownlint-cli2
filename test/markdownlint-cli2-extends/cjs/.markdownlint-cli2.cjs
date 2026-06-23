// @ts-check

"use strict";

const { deepFreeze } = require("../../deep-freeze.cjs");

module.exports = deepFreeze({
  "config": {
    "extends": "../outer.jsonc",
    "no-multiple-blanks": false
  }
});
