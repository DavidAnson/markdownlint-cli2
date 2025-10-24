// @ts-check

import path from "node:path";
import { "main" as markdownlintCli2 } from "../markdownlint-cli2.mjs";
import testCases from "./markdownlint-cli2-test-cases.mjs";

const linesEndingWithNewLine = (/** @type {string[]} */ lines) => lines.map((line) => `${line}\n`).join("");

const invoke = (/** @type {string} */ directory, /** @type {string[]} */ args, /** @type {boolean | undefined} */ noImport) => () => {
  /** @type {string[]} */
  const stdouts = [];
  /** @type {string[]} */
  const stderrs = [];
  return markdownlintCli2({
    directory,
    "argv": args,
    "logMessage": (/** @type {string} */ msg) => stdouts.push(msg),
    "logError": (/** @type {string} */ msg) => stderrs.push(msg),
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

const absolute = (/** @type {string} */ rootDir, /** @type {string} */ file) => path.join(rootDir, file);

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
