// @ts-check

import path from "node:path";
import { __dirname } from "./esm-helpers.mjs";
import { "main" as markdownlintCli2 } from "../markdownlint-cli2.mjs";
import { copyDir, linesEndingWithNewLine, removeDir } from "./markdownlint-cli2-test-helpers.mjs";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import { getFsMock, mockRoot } from "./fs-mock.mjs";

const fsMock = await getFsMock(__dirname(import.meta));

const invoke = (/** @type {string} */ relative, /** @type {string[]} */ args, /** @type {boolean | undefined} */ noImport) => () => {
  /** @type {string[]} */
  const stdouts = [];
  /** @type {string[]} */
  const stderrs = [];
  return markdownlintCli2({
    "directory": path.posix.join(mockRoot, relative),
    "argv": args,
    "logMessage": (/** @type {string} */ msg) => stdouts.push(msg),
    "logError": (/** @type {string} */ err) => stderrs.push(err),
    noImport,
    "fs": fsMock
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
  "host": "fs",
  invoke,
  copyDir,
  removeDir,
  "includeNoImport": true,
  "includeEnv": false,
  "includeScript": false,
  "includeRequire": false,
  "includeAbsolute": false
});
