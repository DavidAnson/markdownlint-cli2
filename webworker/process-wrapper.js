// @ts-check

"use strict";

// eslint-disable-next-line unicorn/prefer-node-protocol, n/no-missing-require
const processBrowser = require("process/browser");
processBrowser.versions = {
  "node": "0.0"
};
module.exports = processBrowser;
