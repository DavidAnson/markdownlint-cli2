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
    new webpack.NormalModuleReplacementPlugin(
      nodeModulePrefixRe,
      (resource) => {
        let module = resource.request.replace(nodeModulePrefixRe, "");
        if (module === "url") {
          module = "url-stub";
        }
        resource.request = module;
      }
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^unicorn-magic$/u,
      (resource) => {
        resource.request = require.resolve("./unicorn-magic-stub.js");
      }
    ),
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
      "process": require.resolve("./process-wrapper.js"),
      "process-wrapper": require.resolve("./process-wrapper.js"),
      "stream": require.resolve("stream-browserify"),
      "url-stub": require.resolve("./url-stub.js")
    }
  }
};
