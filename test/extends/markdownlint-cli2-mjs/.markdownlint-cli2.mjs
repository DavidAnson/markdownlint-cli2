// @ts-check

import { deepFreeze } from "../../deep-freeze.cjs";

export default deepFreeze({
  "config": {
    "extends": "../base.json",
    "single-trailing-newline": false
  },
  "overrides": [
    {
      "filter": [ "*.md" ],
      "config": {
        "first-line-heading": false
      },
      "combine": "merge"
    }
  ]
});
