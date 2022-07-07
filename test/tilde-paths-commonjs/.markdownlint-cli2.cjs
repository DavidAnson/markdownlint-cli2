// @ts-check

"use strict";

const { homedir } = require("os");
const { relative, resolve } = require("path");

const makeTildePath = (script) => {
  const dir = resolve(__dirname, "scripts", script);
  return `~/${relative(homedir(), dir)}`;
};

module.exports = {
  "customRules": [
    makeTildePath("any-blockquote.cjs")
  ],
  "markdownItPlugins": [
    [ makeTildePath("custom-markdown-it-plugin.cjs") ]
  ],
  "outputFormatters": [
    [ makeTildePath("custom-output-formatter.cjs") ]
  ]
};
