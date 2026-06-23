// @ts-check

"use strict";

const { deepFreeze } = require("../../deep-freeze.cjs");

module.exports = deepFreeze({
  "config": {
    "no-trailing-spaces": false,
    "no-multiple-space-atx": false,
    "single-trailing-newline": false
  },
  "noBanner": true
});
