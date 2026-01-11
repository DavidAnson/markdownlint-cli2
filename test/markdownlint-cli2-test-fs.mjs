// @ts-check

import fs from "node:fs";
import path from "node:path";
import * as globby from "globby";
import { __dirname } from "./esm-helpers.mjs";
import { "main" as markdownlintCli2 } from "../markdownlint-cli2.mjs";
import { linesEndingWithNewLine } from "./markdownlint-cli2-test-helpers.mjs";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import FsVirtual from "../webworker/fs-virtual.cjs";

const directory = __dirname(import.meta);
const baseDir = "/virtual";
const files = await FsVirtual.mirrorDirectory(fs, directory, globby, baseDir);
const fsVirtual = new FsVirtual(files);

const copyDir = (/** @type {string} */ fromDir, /** @type {string} */ toDir) => {
  const fromPrefix = `${baseDir}/${fromDir}/`;
  const toPrefix = `${baseDir}/${toDir}/`;
  /** @type {[string, string][]} */
  const toFiles = [];
  for (const [ file, data ] of files) {
    if (file.startsWith(fromPrefix)) {
      toFiles.push([ `${toPrefix}${file.slice(fromPrefix.length)}`, data ]);
    }
  }
  fsVirtual.updateFiles(toFiles);
  return Promise.resolve();
};

const removeDir = () => Promise.resolve();

const invoke = (/** @type {string} */ relative, /** @type {string[]} */ args, /** @type {boolean | undefined} */ noImport) => () => {
  /** @type {string[]} */
  const stdouts = [];
  /** @type {string[]} */
  const stderrs = [];
  return markdownlintCli2({
    "directory": path.posix.join(baseDir, relative),
    "argv": args,
    "logMessage": (/** @type {string} */ msg) => stdouts.push(msg),
    "logError": (/** @type {string} */ err) => stderrs.push(err),
    noImport,
    "fs": fsVirtual
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
  baseDir,
  invoke,
  copyDir,
  removeDir,
  "includeNoImport": true,
  "includeEnv": false,
  "includeScript": false,
  "includeRequire": false
});
