// @ts-check

import path from "node:path";
import test from "node:test";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import { copyDir, removeDir } from "./markdownlint-cli2-test-helpers.mjs";
import { main as markdownlintCli2 } from "../markdownlint-cli2.mjs";

const baseDir = import.meta.dirname;

const invoke = (/** @type {string} */ relative, /** @type {string[]} */ args, /** @type {boolean | undefined} */ noImport) => () => {
  const directory = path.join(baseDir, relative);
  /** @type {string[]} */
  const stdout = [];
  /** @type {string[]} */
  const stderr = [];
  return markdownlintCli2({
    directory,
    "argv": args,
    "logMessage": (/** @type {string} */ msg) => {
      stdout.push(msg);
    },
    "logError": (/** @type {string} */ msg) => {
      stderr.push(msg);
    },
    noImport
  }).
    then(
      (exitCode) => exitCode,
      (error) => {
        stderr.push(error.message);
        return 2;
      }
    ).
    then((exitCode) => ({
      exitCode,
      stdout,
      stderr
    }));
};

test.suite(import.meta.url.replace(/^.*?\/(?<name>[^/]*)$/u, "$<name>"), () => {

  // eslint-disable-next-line node-test/require-hook
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

});
