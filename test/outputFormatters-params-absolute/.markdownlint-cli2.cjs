// @ts-check

"use strict";

const path = require("node:path");
const { deepFreeze } = require("../deep-freeze.cjs");

module.exports = deepFreeze({
  "outputFormatters": [
    [
      "../../formatter-codequality",
      {
        "name": path.resolve(__dirname, "custom-name-codequality.json")
      }
    ],
    [
      "../../formatter-json",
      {
        "name": path.resolve(__dirname, "custom-name-results.json"),
        "spaces": 1
      }
    ],
    [
      "../../formatter-junit",
      {
        "name": path.resolve(__dirname, "custom-name-junit.xml")
      }
    ],
    [
      "../../formatter-sarif",
      {
        "name": path.resolve(__dirname, "custom-name-sarif.sarif")
      }
    ]
  ]
});
