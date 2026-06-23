// @ts-check

"use strict";

const formatterJson = require("../../formatter-json");
const { deepFreeze } = require("../deep-freeze.cjs");

module.exports = deepFreeze({
  "outputFormatters": [
    [ formatterJson, { "name": "custom-name-results.json", "spaces": 1 } ]
  ]
});
