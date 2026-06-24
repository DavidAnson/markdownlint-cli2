// @ts-check

const { deepFreeze } = require("../../deep-freeze.cjs");

module.exports = deepFreeze({
  "config": {
    "extends": "../base.yaml",
    "single-trailing-newline": false
  }
});
