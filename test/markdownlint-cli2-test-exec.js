// @ts-check

"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const testCases = require("./markdownlint-cli2-test-cases");

const invoke = (directory, args, noRequire, env, script) => async () => {
  await fs.access(directory);
  const { "default": spawn } = await import("nano-spawn");
  return spawn(
    "node",
    [
      path.join(__dirname, "..", script || "markdownlint-cli2.js"),
      ...args
    ],
    {
      "cwd": directory,
      "env": env || {}
    }
  ).
    then((subprocess) => ({
      ...subprocess,
      "exitCode": 0
    })).
    catch((error) => error);
};

const absolute = (rootDir, file) => path.join(rootDir, file);

testCases({
  "host": "exec",
  invoke,
  absolute,
  "includeNoRequire": false,
  "includeEnv": true,
  "includeScript": true,
  "includeRequire": true,
  "includeAbsolute": true
});
