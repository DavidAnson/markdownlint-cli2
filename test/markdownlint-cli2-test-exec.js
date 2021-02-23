// @ts-check

"use strict";

const path = require("path");
const execa = require("execa");

const testCases = require("./markdownlint-cli2-test-cases");

const invoke = (name, script, args, cwd, env) => () => execa.node(
  path.join(__dirname, "..", script || "markdownlint-cli2.js"),
  args,
  {
    "cwd": path.join(__dirname, `${cwd || name}`),
    "env": env || {},
    "reject": false,
    "stripFinalNewline": false
  }
);

testCases("exec", invoke);
