// @ts-check

import path from "node:path";
import { "main" as markdownlintCli2 } from "../markdownlint-cli2.mjs";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import FsMock from "./fs-mock.mjs";
const mockDirectory = "/mock";

const linesEndingWithNewLine = (/** @type {string[]} */ lines) => lines.map((line) => `${line}\n`).join("");

const invoke = (/** @type {string} */ directory, /** @type {string[]} */ args, /** @type {boolean | undefined} */ noImport) => () => {
  /** @type {string[]} */
  const stdouts = [];
  /** @type {string[]} */
  const stderrs = [];
  return markdownlintCli2({
    "directory": mockDirectory,
    "argv": args,
    "logMessage": (/** @type {string} */ msg) => stdouts.push(msg),
    "logError": (/** @type {string} */ msg) => stderrs.push(msg),
    noImport,
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

const absolute = (/** @type {string} */ rootDir, /** @type {string} */ file) => path.join(mockDirectory, file);

testCases({
  "host": "fs",
  invoke,
  absolute,
  "includeNoImport": true,
  "includeEnv": false,
  "includeScript": false,
  "includeRequire": false,
  "includeAbsolute": false
});
