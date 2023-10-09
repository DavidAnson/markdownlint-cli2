// @ts-check

"use strict";

const { homedir } = require("os");
const { relative, resolve } = require("path");

const makeTildePath = (script) => {
  const dir = resolve(__dirname, script);
  return `~/${relative(homedir(), dir)}`;
};

module.exports = {
  "customRules": [
    makeTildePath("scripts/any-blockquote.cjs"),
    "markdownlint-rule-sample-commonjs"
  ],
  "markdownItPlugins": [
    [ makeTildePath("scripts/custom-markdown-it-plugin.cjs") ],
    [ "custom-markdown-it-plugin" ]
  ],
  "outputFormatters": [
    [ makeTildePath("scripts/custom-output-formatter.cjs") ],
    [ "output-formatter-sample-commonjs" ]
  ],
  "modulePaths": [
    makeTildePath("../customRules"),
    makeTildePath("../markdownItPlugins/module"),
    makeTildePath("../outputFormatters-module")
  ]
};
