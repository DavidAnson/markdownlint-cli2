// @ts-check

import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import * as globby from "globby";
import { main as markdownlintCli2 } from "../markdownlint-cli2.mjs";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import FsVirtual from "../webworker/fs-virtual.cjs";

const directory = import.meta.dirname;
const baseDir = directory.replaceAll("\\", "/").replace(/^[^/]*/u, "");
const files = await FsVirtual.mirrorDirectory(fs, directory, globby, baseDir);

const copyDir = () => Promise.reject(new Error("UNUSED"));
const removeDir = copyDir;

const invoke = (/** @type {string} */ relative, /** @type {string[]} */ args, /** @type {boolean | undefined} */ noImport) => () => {
  /** @type {string[]} */
  const stdout = [];
  /** @type {string[]} */
  const stderr = [];
  const fsVirtual = new FsVirtual(files);
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
    catch((error) => {
      stderr.push(error.message);
      return 2;
    }).
    then((exitCode) => ({
      exitCode,
      stdout,
      stderr,
      "readFile": fsVirtual.promises.readFile
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
    "usesVirtualFs": true
  });

});
