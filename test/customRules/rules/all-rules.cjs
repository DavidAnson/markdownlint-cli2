// @ts-check

"use strict";

const { deepFreeze } = require("../../deep-freeze.cjs");

module.exports = deepFreeze([
  require("./any-blockquote.cjs"),
  require("./every-n-lines.cjs"),
  require("./first-line.cjs"),
  require("./second-line.cjs")
]);
