// @ts-check

import { deepFreeze } from "../../deep-freeze.cjs";

const config = deepFreeze({
  "no-trailing-spaces": false,
  "no-multiple-space-atx": false,
  "single-trailing-newline": false
});

export default config;
