// @ts-check

"use strict";

const jsoncParse = require("./jsonc-parse");
const yamlParse = require("./yaml-parse");

/**
 * Array of parser objects ordered by priority.
 */
const parsers = [
  jsoncParse,
  yamlParse
];

module.exports = parsers;
