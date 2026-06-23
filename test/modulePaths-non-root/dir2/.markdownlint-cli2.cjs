// @ts-check

"use strict";

const path = require("node:path");
const { deepFreeze } = require("../../deep-freeze.cjs");

module.exports = deepFreeze({
  "customRules": [
    "markdownlint-rule-sample-commonjs"
  ],
  "markdownItPlugins": [
    [ "custom-markdown-it-plugin" ]
  ],
  "modulePaths": [
    "../../customRules",
    "../../invalid",
    "../../no-config",
    "../../markdownItPlugins/module"
  ].map((dir) => path.resolve(__dirname, dir))
});
