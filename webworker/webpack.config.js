// @ts-check

"use strict";

/* eslint-disable n/no-missing-require */

const webpack = require("webpack");
const nodeModulePrefixRe = /^node:/u;

module.exports = {
  "target": "webworker",
  "entry": "./index.js",
  "output": {
    "path": __dirname,
    "filename": "markdownlint-cli2-webworker.js",
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
    // Intercept "node:stream/promises" lacking a browserify entry
    new webpack.NormalModuleReplacementPlugin(
      /^stream\/promises$/u,
      (resource) => {
        resource.request = require.resolve("./stream-promises.js");
      }
    ),
    // Intercept existing "unicorn-magic" package to provide missing import
    new webpack.NormalModuleReplacementPlugin(
      /^unicorn-magic$/u,
      (resource) => {
        resource.request = require.resolve("./unicorn-magic-stub.js");
      }
    ),
    // Intercept use of "process" to provide implementation
    new webpack.ProvidePlugin({
      "process": "process-wrapper"
    })
  ],
  "resolve": {
    "fallback": {
      "buffer": false,
      "fs": false,
      "os": require.resolve("./os-stub.js"),
      "path": require.resolve("path-browserify"),
      "process": require.resolve("./process-stub.js"),
      "process-wrapper": require.resolve("./process-stub.js"),
      "stream": require.resolve("stream-browserify"),
      "url": require.resolve("./url-stub.js")
    }
  }
};
