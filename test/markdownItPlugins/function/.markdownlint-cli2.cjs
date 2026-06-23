// @ts-check

"use strict";

const { deepFreeze } = require("../../deep-freeze.cjs");

module.exports = deepFreeze({
  "config": {
    "assert-markdown-it-tokens": {
      "file": "function.json"
    }
  },
  "customRules": [
    "../custom-rule-assert-markdown-it-tokens.mjs"
  ],
  "markdownItPlugins": [
    [
      "markdown-it-for-inline",
      "trim_text_plugin",
      "text",
      function iterator(/** @type {import("markdownlint").MarkdownItToken[]} */ tokens, /** @type {number} */ index) {
        tokens[index].content = tokens[index].content.trim();
      }
    ]
  ]
});
