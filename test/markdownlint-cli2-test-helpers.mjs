// @ts-check

import fs from "node:fs/promises";
import path from "node:path";
import cpy from "cpy";
import { __dirname } from "./esm-helpers.mjs";

// eslint-disable-next-line no-empty-function
const noop = () => {};

const copyDir = (/** @type {string} */ fromDir, /** @type {string} */ toDir) => cpy(
  path.join(__dirname(import.meta), fromDir, "**"),
  path.join(__dirname(import.meta), toDir)
).then(noop);

const removeDir = (/** @type {string} */ dir) =>
  fs.rm(path.join(__dirname(import.meta), dir), { "recursive": true });

const linesEndingWithNewLine = (/** @type {string[]} */ lines) => lines.map((line) => `${line}\n`).join("");

export {
  copyDir,
  linesEndingWithNewLine,
  removeDir
};
