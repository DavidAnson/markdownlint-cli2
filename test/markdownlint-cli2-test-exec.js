// @ts-check

"use strict";

const path = require("path");
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

testCases("exec", invoke, false, true, true, true);
