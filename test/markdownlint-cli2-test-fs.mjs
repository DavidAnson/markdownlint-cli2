// @ts-check

import path from "node:path";
import { "main" as markdownlintCli2 } from "../markdownlint-cli2.mjs";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import FsMock from "./fs-mock.mjs";
const mockDirectory = "/mock";

const linesEndingWithNewLine =
  (lines) => lines.map((line) => `${line}\n`).join("");

const invoke = (directory, args, noRequire) => () => {
  const stdouts = [];
  const stderrs = [];
  return markdownlintCli2({
    "directory": mockDirectory,
    "argv": args,
    "logMessage": (msg) => stdouts.push(msg),
    "logError": (msg) => stderrs.push(msg),
    noRequire,
    "fs": new FsMock(directory)
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

const absolute = (rootDir, file) => path.join(mockDirectory, file);

testCases({
  "host": "fs",
  invoke,
  absolute,
  "includeNoRequire": true,
  "includeEnv": false,
  "includeScript": false,
  "includeRequire": false,
  "includeAbsolute": false
});
