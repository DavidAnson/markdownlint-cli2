// @ts-check

"use strict";

const path = require("path");
const { "main": markdownlintCli2 } = require("../markdownlint-cli2.js");
const testCases = require("./markdownlint-cli2-test-cases");

const linesEndingWithNewLine =
  (lines) => lines.map((line) => `${line}\n`).join("");

const invoke = (directory, args, noRequire) => () => {
  const stdouts = [];
  const stderrs = [];
  return markdownlintCli2({
    directory,
    "argv": args,
    "logMessage": (msg) => stdouts.push(msg),
    "logError": (msg) => stderrs.push(msg),
    noRequire
  }).
    then(
      (exitCode) => exitCode,
      (error) => {
        stderrs.push(error.message);
        return 2;
      }
    ).
    then((exitCode) => ({
      exitCode,
      "stdout": linesEndingWithNewLine(stdouts),
      "stderr": linesEndingWithNewLine(stderrs)
    }));
};

const absolute = (rootDir, file) => path.join(rootDir, file);

testCases("main", invoke, absolute, true, false, false, true);
