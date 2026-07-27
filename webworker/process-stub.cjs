// @ts-check

"use strict";

module.exports = {
  "argv": [],
  "cwd": () => "/",
  "env": {},
  // eslint-disable-next-line jsdoc/reject-function-type, jsdoc/reject-any-type
  "nextTick": (/** @type {Function} */ callback, /** @type {any[]} */ ...args) =>
    queueMicrotask(() => callback(...args)),
  "versions": {
    "node": "0.0"
  }
};
