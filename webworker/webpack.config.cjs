// @ts-check

"use strict";

/* eslint-disable n/no-missing-require */

const webpack = require("webpack");
const nodeModulePrefixRe = /^node:/u;

/** @type {import("webpack").Configuration} */
module.exports = {
  "target": "webworker",
  "entry": "../markdownlint-cli2.mjs",
  "output": {
    "path": __dirname,
    "filename": "markdownlint-cli2-webworker.cjs",
    "library": {
      "name": "markdownlintCli2",
      "type": "var"
    }
  },
  "plugins": [
    // Rewrite requires to remove "node:" prefix
    new webpack.NormalModuleReplacementPlugin(
      nodeModulePrefixRe,
      (resource) => {
        const module = resource.request.replace(nodeModulePrefixRe, "");
        resource.request = module;
      }
    ),
    // Intercept "node:stream/consumers" and "node:stream/promises" lacking a browserify entry
    new webpack.NormalModuleReplacementPlugin(
      /^stream\/(?:consumers|promises)$/u,
      (resource) => {
        resource.request = require.resolve("./module-empty.cjs");
      }
    ),
    // Intercept existing "unicorn-magic" package to provide missing import
    new webpack.NormalModuleReplacementPlugin(
      /^unicorn-magic$/u,
      (resource) => {
        resource.request = require.resolve("./unicorn-magic-stub.cjs");
      }
    ),
    // Intercept use of "process" to provide implementation
    new webpack.ProvidePlugin({
      "process": "process-wrapper"
    })
  ],
  "resolve": {
    "conditionNames": [ "markdownlint-imports-node", "..." ],
    "fallback": {
      "buffer": false,
      "fs": false,
      "os": require.resolve("./os-stub.cjs"),
      "path": require.resolve("path-browserify"),
      "process": require.resolve("./process-stub.cjs"),
      "process-wrapper": require.resolve("./process-stub.cjs"),
      "stream": require.resolve("stream-browserify"),
      "url": require.resolve("./module-empty.cjs")
    }
  },
  "ignoreWarnings": [
    {
      "message": /dependencies cannot be statically extracted/u
    }
  ]
};
