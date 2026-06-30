// @ts-check

const { deepFreeze } = require("../../deep-freeze.cjs");

module.exports = deepFreeze({
  "config": {
    "no-multiple-space-atx": false,
    "single-trailing-newline": false
  },
  "customRules": [
    "../modules/first-line.cjs"
  ],
  "markdownItPlugins": [
    [ "../modules/custom-markdown-it-plugin.cjs" ]
  ],
  "outputFormatters": [
    [ "../modules/custom-output-formatter.mjs" ]
  ]
});
