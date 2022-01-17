// @ts-check

"use strict";

const markdownItForInline = require("markdown-it-for-inline");

module.exports = {
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
