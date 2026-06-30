// @ts-check

"use strict";

const { deepFreeze } = require("../../deep-freeze.cjs");

module.exports = deepFreeze((/** @type {any} */ md) => {
  md.core.ruler.push("custom-markdown-it-plugin", (/** @type {any} */ state) => {
    for (const token of state.tokens.filter((/** @type {import("markdownlint").MarkdownItToken} */ t) => t.type === "inline")) {
      for (const child of token.children.filter((/** @type {import("markdownlint").MarkdownItToken} */ c) => c.type === "text")) {
        child.content = child.content.trim();
      }
    }
  });
});
