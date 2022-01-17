// @ts-check

"use strict";

const formatterJson = require("../../formatter-json");

module.exports = {
  "outputFormatters": [
    [ formatterJson, { "name": "custom-name.json", "spaces": 1 } ]
  ]
}
