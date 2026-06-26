// @ts-check

const { deepFreeze } = require("../../deep-freeze.cjs");

module.exports = deepFreeze({
  "config": {
    "extends": "../base.yaml",
    "single-trailing-newline": false
  },
  "overrides": [
    {
      "filter": [ "*.md" ],
      "config": {
        "extends": "../nest.yaml",
        "first-line-heading": false
      },
      "combine": "merge"
    }
  ]
});
