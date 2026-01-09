// @ts-check

import path from "node:path";
import { __dirname } from "./esm-helpers.mjs";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import { copyDir, linesEndingWithNewLine, removeDir } from "./markdownlint-cli2-test-helpers.mjs";
import { "main" as markdownlintCli2 } from "../markdownlint-cli2.mjs";

const baseDir = __dirname(import.meta);

const invoke = (/** @type {string} */ relative, /** @type {string[]} */ args, /** @type {boolean | undefined} */ noImport) => () => {
  const directory = path.join(baseDir, relative);
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

testCases({
  "host": "main",
  baseDir,
  invoke,
  copyDir,
  removeDir,
  "includeNoImport": true,
  "includeEnv": false,
  "includeScript": false,
  "includeRequire": true
});
