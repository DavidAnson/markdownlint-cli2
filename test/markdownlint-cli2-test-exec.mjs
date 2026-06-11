// @ts-check

import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { execa } from "execa";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import { copyDir, removeDir } from "./markdownlint-cli2-test-helpers.mjs";

const baseDir = import.meta.dirname;

const repositoryPath = (/** @type {string} */ name) => path.join(baseDir, "..", name);

const invoke = (/** @type {string} */ relative, /** @type {string[]} */ args, /** @type {boolean | undefined} */ noImport, /** @type {Record<string, string> | undefined} */ env, /** @type {string | undefined} */ script) => async () => {
  const directory = path.join(baseDir, relative);
  await fs.access(directory);
  return execa(
    "node",
    [
      repositoryPath(script || "markdownlint-cli2-bin.mjs"),
      ...args
    ],
    {
      "cwd": directory,
      "env": env || {}
    }
  ).
    then((subprocess) => ({
      ...subprocess,
      "exitCode": 0
    })).
    catch((error) => error);
};

test.suite(import.meta.url.replace(/^.*?\/(?<name>[^/]*)$/u, "$<name>"), () => {

  testCases({
    "host": "exec",
    baseDir,
    invoke,
    copyDir,
    removeDir,
    "includeNoImport": false,
    "includeEnv": true,
    "includeScript": true,
    "includeRequire": true
  });

});
