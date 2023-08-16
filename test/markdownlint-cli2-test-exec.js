// @ts-check

"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const testCases = require("./markdownlint-cli2-test-cases");

const invoke = (directory, args, noRequire, env, script) => async () => {
  await fs.access(directory);
  const { execaNode } = await import("execa");
  return execaNode(
    path.join(__dirname, "..", script || "markdownlint-cli2.js"),
    args,
    {
      "cwd": directory,
      "env": env || {},
      "reject": false,
      "stripFinalNewline": false
    }
  );
};

const absolute = (rootDir, file) => path.join(rootDir, file);

testCases({
  "host": "exec",
  invoke,
  absolute,
  "includeNoRequire": false,
  "includeEnv": true,
  "includeScript": true,
  "includeRequire": true
});
