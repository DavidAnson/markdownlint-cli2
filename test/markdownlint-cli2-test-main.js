// @ts-check

"use strict";

const { "main": markdownlintCli2 } = require("../markdownlint-cli2.js");
const testCases = require("./markdownlint-cli2-test-cases");

const linesEndingWithNewLine =
  (lines) => lines.map((line) => `${line}\n`).join("");

const invoke = (directory, args) => () => {
  const stdouts = [];
  const stderrs = [];
  return markdownlintCli2({
    directory,
    "argv": args,
    "logMessage": (msg) => stdouts.push(msg),
    "logError": (msg) => stderrs.push(msg)
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

testCases("main", invoke, false, false);
