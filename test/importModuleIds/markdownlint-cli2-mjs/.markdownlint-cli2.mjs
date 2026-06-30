// @ts-check

import { deepFreeze } from "../../deep-freeze.cjs";

export default deepFreeze({
  "config": {
    "no-multiple-space-atx": false,
    "single-trailing-newline": false
  },
  "customRules": [
    "../modules/first-line.cjs"
  ],
  "markdownItPlugins": [
    [ "../modules/custom-markdown-it-plugin.cjs" ]
  ],
  "outputFormatters": [
    [ "../modules/custom-output-formatter.mjs" ]
  ]
});
