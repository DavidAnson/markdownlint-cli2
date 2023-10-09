// @ts-check

import { homedir } from "os";
import { dirname, relative, resolve } from "path";
import { fileURLToPath } from "url";

const makeTildePath = (script) => {
  const dir = resolve(
    dirname(fileURLToPath(import.meta.url)),
    script
  );
  return `~/${relative(homedir(), dir)}`;
};

const options = {
  "customRules": [
    makeTildePath("scripts/any-blockquote.mjs"),
    "markdownlint-rule-sample-commonjs"
  ],
  "markdownItPlugins": [
    [ makeTildePath("scripts/custom-markdown-it-plugin.mjs") ],
    [ "custom-markdown-it-plugin" ]
  ],
  "outputFormatters": [
    [ makeTildePath("scripts/custom-output-formatter.mjs") ],
    [ "output-formatter-sample-commonjs" ]
  ],
  "modulePaths": [
    makeTildePath("../customRules"),
    makeTildePath("../markdownItPlugins/module"),
    makeTildePath("../outputFormatters-module")
  ]
};

export default options;
