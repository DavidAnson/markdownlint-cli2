// @ts-check

import { deepFreeze } from "../../deep-freeze.cjs";

const options = deepFreeze({
  "config": {
    "no-trailing-spaces": false,
    "no-multiple-space-atx": false,
    "single-trailing-newline": false
  },
  "noBanner": true
});

export default options;
