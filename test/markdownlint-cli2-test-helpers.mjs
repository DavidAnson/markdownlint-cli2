// @ts-check

import fs from "node:fs/promises";
import path from "node:path";
import cpy from "cpy";

// eslint-disable-next-line no-empty-function
const noop = () => {};

const copyDir = (/** @type {string} */ fromDir, /** @type {string} */ toDir) => cpy(
  path.join(import.meta.dirname, fromDir, "**"),
  path.join(import.meta.dirname, toDir),
  { "dot": true }
).then(noop);

const removeDir = (/** @type {string} */ dir) =>
  fs.rm(path.join(import.meta.dirname, dir), { "recursive": true });

const linesEndingWithNewLine = (/** @type {string[]} */ lines) => lines.map((line) => `${line}\n`).join("");

export {
  copyDir,
  linesEndingWithNewLine,
  removeDir
};
