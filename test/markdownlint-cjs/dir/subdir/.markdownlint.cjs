// @ts-check

"use strict";

const { deepFreeze } = require("../../../deep-freeze.cjs");

module.exports = Promise.resolve(deepFreeze({
  "first-line-heading": false
}));
