// @ts-check

"use strict";

const markdownItForInline = require("markdown-it-for-inline");

module.exports = {
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
      function iterator(tokens, index) {
        tokens[index].content = tokens[index].content.trim();
      }
    ]
  ]
};
