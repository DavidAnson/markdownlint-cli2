// @ts-check

"use strict";

const { deepFreeze } = require("../../../deep-freeze.cjs");

module.exports = Promise.resolve(deepFreeze({
  "config": {
    "first-line-heading": false
  }
}));
