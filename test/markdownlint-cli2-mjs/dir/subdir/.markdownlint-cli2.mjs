// @ts-check

import { deepFreeze } from "../../../deep-freeze.cjs";

const options = Promise.resolve(deepFreeze({
  "config": {
    "first-line-heading": false
  }
}));

export default options;
