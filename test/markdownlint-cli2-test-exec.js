// @ts-check

"use strict";

const path = require("node:path");
const testCases = require("./markdownlint-cli2-test-cases");

const invoke = (directory, args, noRequire, env, script) => async () => {
  // eslint-disable-next-line node/no-unsupported-features/es-syntax
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

testCases("exec", invoke, absolute, false, true, true, true);
