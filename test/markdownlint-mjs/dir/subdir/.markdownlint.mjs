// @ts-check

import { deepFreeze } from "../../../deep-freeze.cjs";

const config = Promise.resolve(deepFreeze({
  "first-line-heading": false
}));

export default config;
