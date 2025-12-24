// @ts-check

import nfs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import test from "ava";
import * as globby from "globby";
import { __dirname, __filename } from "./esm-helpers.mjs";
import FsVirtual from "../webworker/fs-virtual.cjs";

const mockPath = "/mock";
const thisFile = path.basename(__filename(import.meta));
const testFile = path.join(mockPath, thisFile);

const mockFsMock = async (/** @type {string} */ dir) => new FsVirtual(await FsVirtual.mirrorDirectory(nfs, dir, globby, mockPath));

test("fsMock.lstat", async (t) => {
  t.plan(3);
  const fs = await mockFsMock(__dirname(import.meta));
  const fsLstat = promisify(fs.lstat);
  // @ts-ignore
  const stat = await fsLstat(testFile);
  t.truthy(stat);
  t.true(stat.size > 0);
  t.true(stat.isSymbolicLink());
});

test("fsMock.readdir", async (t) => {
  t.plan(3);
  const fs = await mockFsMock(__dirname(import.meta));
  const fsReaddir = promisify(fs.readdir);
  // @ts-ignore
  const files = await fsReaddir(mockPath);
  t.true(Array.isArray(files));
  t.true(files.length > 0);
  t.true(files.includes(thisFile));
});

test("fsMock.*", async (t) => {
  t.plan(1);
  const fs = await mockFsMock(__dirname(import.meta));
  const fsAccess = promisify(fs.access);
  // @ts-ignore
  await fsAccess(testFile);
  const fsLstat = promisify(fs.lstat);
  // @ts-ignore
  await fsLstat(testFile);
  const fsReadFile = promisify(fs.readFile);
  // @ts-ignore
  const content = await fsReadFile(testFile, "utf8");
  t.true(content && (content.length > 0));
});

test("fsMock.promises.*", async (t) => {
  t.plan(2);
  const fs = await mockFsMock(__dirname(import.meta));
  const tempName = "fs-mock.tmp";
  const tempFile = path.join(mockPath, tempName);
  await t.throwsAsync(() => fs.promises.access(tempFile));
  await fs.promises.writeFile(tempFile, tempFile);
  await fs.promises.access(tempFile);
  await fs.promises.stat(tempFile);
  t.is(await fs.promises.readFile(tempFile, "utf8"), tempFile);
});
