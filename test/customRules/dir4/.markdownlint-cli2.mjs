// @ts-check

import { sep as sepDefault } from "node:path";
import { sep as sepPosix } from "node:path/posix";

const options = {
  "customRules": [
    (new URL(
      "../node_modules/markdownlint-rule-sample-module/sample-rule.mjs",
      import.meta.url
    )).toString()
  ]
};

export default options;
