// @ts-check

import { deepFreeze } from "../deep-freeze.cjs";

export const nullifyPrototype = (/** @type {object} */ obj) => {
  JSON.stringify(obj, (key, value) => {
    if ((value instanceof Object) && (!Array.isArray(value))) {
      Object.setPrototypeOf(value, null);
    }
    return value;
  });
  return obj;
};

const options = deepFreeze(nullifyPrototype({
  "config": {
    "default": false,
    "report-config": {
      "null": null,
      "number": 1,
      "string": "s",
      "array": [ null, 1, "s" ],
      "object": {
        "key": "value"
      }
    }
  },
  "customRules": [
    "./custom-rule-report-config.mjs"
  ]
}));

export default options;
