// @ts-check

import path from "node:path";
import { "main" as markdownlintCli2 } from "../markdownlint-cli2.mjs";
import testCases from "./markdownlint-cli2-test-cases.mjs";

const linesEndingWithNewLine =
  (lines) => lines.map((line) => `${line}\n`).join("");

const invoke = (directory, args, noImport) => () => {
  const stdouts = [];
  const stderrs = [];
  return markdownlintCli2({
    directory,
    "argv": args,
    "logMessage": (msg) => stdouts.push(msg),
    "logError": (msg) => stderrs.push(msg),
    noImport
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

testCases({
  "host": "main",
  invoke,
  absolute,
  "includeNoImport": true,
  "includeEnv": false,
  "includeScript": false,
  "includeRequire": true,
  "includeAbsolute": true
});
