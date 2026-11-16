// @ts-check

import { deepFreeze } from "../../deep-freeze.cjs";
import { nullifyPrototype } from "../.markdownlint-cli2.mjs";

const config = deepFreeze(nullifyPrototype({
  "default": false,
  "report-config": {
    "null": null,
    "number": 2,
    "string": "t",
    "array": [ null, 2, "t" ],
    "object": {
      "key2": "value2"
    }
  }
}));

export default config;
