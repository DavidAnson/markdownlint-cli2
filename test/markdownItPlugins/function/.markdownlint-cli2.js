// @ts-check

"use strict";

module.exports = {
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
