// @ts-check

"use strict";

const path = require("path");
const execa = require("execa");
const testCases = require("./markdownlint-cli2-test-cases");

const invoke = (directory, args, env, script) => () => execa.node(
  path.join(__dirname, "..", script || "markdownlint-cli2.js"),
  args,
  {
    "cwd": directory,
    "env": env || {},
    "reject": false,
    "stripFinalNewline": false
  }
);

testCases("exec", invoke, true, true);
