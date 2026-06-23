// @ts-check

"use strict";

const markdownItForInline = require("markdown-it-for-inline");
const { deepFreeze } = require("../../deep-freeze.cjs");

module.exports = deepFreeze({
  "config": {
    "assert-markdown-it-tokens": {
      "file": "pre-imported.json"
    }
  },
  "customRules": [
    "../custom-rule-assert-markdown-it-tokens.mjs"
  ],
  "markdownItPlugins": [
    [
      markdownItForInline,
      "trim_text_plugin",
      "text",
      function iterator(/** @type {import("markdownlint").MarkdownItToken[]} */ tokens, /** @type {number} */ index) {
        tokens[index].content = tokens[index].content.trim();
      }
    ]
  ]
});
