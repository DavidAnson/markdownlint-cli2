// @ts-check

"use strict";

module.exports = {
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
      function iterator(tokens, index) {
        tokens[index].content = tokens[index].content.trim();
      }
    ]
  ]
};
