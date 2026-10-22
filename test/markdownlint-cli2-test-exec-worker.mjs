// @ts-check

import fs from "node:fs/promises";
import path from "node:path";
import { execa } from "execa";
import workerpool from "workerpool";

const baseDir = import.meta.dirname;

const repositoryPath = (/** @type {string} */ name) => path.join(baseDir, "..", name);

// eslint-disable-next-line unicorn/prefer-default-parameters
const invokeWorker = async (/** @type {string} */ relative, /** @type {string[]} */ args, /** @type {boolean | undefined} */ noImport, /** @type {Record<string, string> | undefined} */ env, /** @type {string | undefined} */ script) => {
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
      "env": env || {},
      "lines": true
    }
  ).
    then((subprocess) => ({
      ...subprocess,
      "exitCode": 0
    })).
    catch((error) => error).
    then((result) => ({
      ...result
    }));
};

workerpool.worker({ invokeWorker });
