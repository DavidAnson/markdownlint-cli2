// @ts-check

import path from "node:path";
import { promisify } from "node:util";
import test from "ava";
import { __filename } from "./esm-helpers.mjs";
import FsVirtual from "../webworker/fs-virtual.cjs";

const mockPath = "/mock";
const thisFile = path.basename(__filename(import.meta));
const testFile = path.join(mockPath, thisFile);
const missingFile = `${mockPath}/missing`;

const virtualFiles = [
  [ "/mock/fs-virtual-test.mjs", "// content" ]
];

test("fsVirtual.stat", async (t) => {
  t.plan(1);
  const fs = new FsVirtual(virtualFiles);
  const fsStat = promisify(fs.stat);
  // @ts-ignore
  const stat = await fsStat(testFile);
  t.truthy(stat);
});

test("fsVirtual.lstat", async (t) => {
  t.plan(10);
  const fs = new FsVirtual(virtualFiles);
  const fsLstat = promisify(fs.lstat);
  // @ts-ignore
  const stat = await fsLstat(testFile);
  t.truthy(stat);
  t.false(stat.isBlockDevice());
  t.false(stat.isCharacterDevice());
  t.false(stat.isDirectory());
  t.false(stat.isFIFO());
  t.true(stat.isFile());
  t.false(stat.isSocket());
  t.false(stat.isSymbolicLink());
  // @ts-ignore
  const missingStat = await fsLstat(missingFile);
  t.truthy(missingStat);
  t.true(missingStat.isDirectory());
});

test("fsVirtual.readdir", async (t) => {
  t.plan(3);
  const fs = new FsVirtual(virtualFiles);
  const fsReaddir = promisify(fs.readdir);
  // @ts-ignore
  const files = await fsReaddir(`${mockPath}/`);
  t.true(Array.isArray(files));
  t.true(files.length > 0);
  t.true(files.includes(thisFile));
});

test("fsVirtual.*", async (t) => {
  t.plan(3);
  const fs = new FsVirtual(virtualFiles);
  const fsAccess = promisify(fs.access);
  // @ts-ignore
  await fsAccess(testFile);
  const fsLstat = promisify(fs.lstat);
  // @ts-ignore
  await fsLstat(testFile);
  const fsStat = promisify(fs.lstat);
  // @ts-ignore
  await fsStat(testFile);
  const fsReadFile = promisify(fs.readFile);
  // @ts-ignore
  const content = await fsReadFile(testFile, "utf8");
  t.true(content.length > 0);
  // @ts-ignore
  await t.throwsAsync(() => fsAccess(missingFile));
  // @ts-ignore
  await t.throwsAsync(() => fsReadFile(missingFile));
});

test("fsVirtual.promises.*", async (t) => {
  t.plan(3);
  const fs = new FsVirtual(virtualFiles);
  const tempName = "fs-mock.tmp";
  const tempFile = path.join(mockPath, tempName);
  await t.throwsAsync(() => fs.promises.access(tempFile));
  await fs.promises.writeFile(tempFile, tempFile, "utf8");
  await fs.promises.access(tempFile);
  await fs.promises.stat(tempFile);
  t.is(await fs.promises.readFile(tempFile, "utf8"), tempFile);
  await t.throwsAsync(() => fs.promises.readFile(missingFile, "utf8"));
});
