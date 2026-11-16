// @ts-check

import { deepFreeze } from "../deep-freeze.cjs";

/** @type {import("markdownlint").Rule} */
const rule = {
  "names": [ "report-config" ],
  "description": "Rule that reports its config",
  "tags": [ "test" ],
  "parser": "none",
  "function": ({ config }, onError) => {
    onError({
      "lineNumber": 1,
      "detail": JSON.stringify(config)
    })
  }
};

const frozenRule = deepFreeze(rule);

export default frozenRule;
