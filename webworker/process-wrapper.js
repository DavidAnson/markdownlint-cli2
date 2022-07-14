// @ts-check

"use strict";

/* eslint-disable node/no-extraneous-require,node/no-missing-require */

// @ts-ignore
const processBrowser = require("process/browser");
processBrowser.versions = {
  "node": "0.0"
};
module.exports = processBrowser;
