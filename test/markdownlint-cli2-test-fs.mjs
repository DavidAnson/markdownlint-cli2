// @ts-check

import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import * as globby from "globby";
import { main as markdownlintCli2 } from "../markdownlint-cli2.mjs";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import FsVirtual from "../webworker/fs-virtual.cjs";

const directory = import.meta.dirname;
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
  const stdout = [];
  /** @type {string[]} */
  const stderr = [];
  return markdownlintCli2({
    "directory": path.posix.join(baseDir, relative),
    "argv": args,
    "logMessage": (/** @type {string} */ msg) => {
      stdout.push(msg);
    },
    "logError": (/** @type {string} */ err) => {
      stderr.push(err);
    },
    noImport,
    "fs": fsVirtual
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

});
