// @ts-check

import testCases from "./markdownlint-cli2-test-cases.mjs";
import { copyDir, linesEndingWithNewLine, removeDir } from "./markdownlint-cli2-test-helpers.mjs";
import { "main" as markdownlintCli2 } from "../markdownlint-cli2.mjs";

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

testCases({
  "host": "main",
  invoke,
  copyDir,
  removeDir,
  "includeNoImport": true,
  "includeEnv": false,
  "includeScript": false,
  "includeRequire": true,
  "includeAbsolute": true
});
