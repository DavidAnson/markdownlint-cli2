// @ts-check

import nodeFs from "node:fs";
import nodePath from "node:path";
import { promisify } from "node:util";
import test from "ava";
import * as globby from "globby";
import { __dirname, __filename } from "./esm-helpers.mjs";
import FsVirtual from "../webworker/fs-virtual.cjs";

const basePath = "/virtual";
const thisFile = nodePath.basename(__filename(import.meta));
const testFile = nodePath.join(basePath, thisFile);
const missingFile = `${basePath}/missing`;

/** @type {[string, string][]} */
const virtualFiles = [
  [ `${basePath}/fs-virtual-test.mjs`, "// content" ]
];

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
  t.plan(11);
  const fs = new FsVirtual(virtualFiles);
  const fsReaddir = promisify(fs.readdir);
  const expectedFile = [ "fs-virtual-test.mjs" ];
  // @ts-ignore
  t.deepEqual(await fsReaddir(basePath), expectedFile);
  // @ts-ignore
  t.deepEqual(await fsReaddir(`${basePath}/`), expectedFile);
  const expectedDir = [ basePath.replace(/^\//u, "") ];
  // @ts-ignore
  t.deepEqual(await fsReaddir("/"), expectedDir);
  // @ts-ignore
  const [ direntFile ] = await fsReaddir(basePath, { "withFileTypes": true });
  if (typeof direntFile !== "string") {
    t.is(direntFile.name, expectedFile[0]);
    t.is(direntFile.parentPath, basePath);
    t.true(direntFile.isFile());
    t.false(direntFile.isDirectory());
  }
  // @ts-ignore
  const [ direntDir ] = await fsReaddir("/", { "withFileTypes": true });
  if (typeof direntDir !== "string") {
    t.is(direntDir.name, expectedDir[0]);
    t.is(direntDir.parentPath, "/");
    t.false(direntDir.isFile());
    t.true(direntDir.isDirectory());
  }
});

test("fsVirtual.*", async (t) => {
  t.plan(3);
  const fs = new FsVirtual(virtualFiles);
  const fsAccess = promisify(fs.access);
  // @ts-ignore
  await fsAccess(testFile);
  const fsLstat = promisify(fs.lstat);
  await fsLstat(testFile);
  const fsReadFile = promisify(fs.readFile);
  const content = await fsReadFile(testFile, "utf8");
  // @ts-ignore
  t.true(content.length > 0);
  // @ts-ignore
  await t.throwsAsync(() => fsAccess(missingFile));
  // @ts-ignore
  await t.throwsAsync(() => fsReadFile(missingFile, "utf8"));
});

test("fsVirtual.promises.*", async (t) => {
  t.plan(3);
  const fs = new FsVirtual(virtualFiles);
  const tempName = "fs-virtual.tmp";
  const tempFile = nodePath.join(basePath, tempName);
  await t.throwsAsync(() => fs.promises.access(tempFile));
  await fs.promises.writeFile(tempFile, tempFile);
  await fs.promises.access(tempFile);
  await fs.promises.stat(tempFile);
  t.is(await fs.promises.readFile(tempFile, "utf8"), tempFile);
  await t.throwsAsync(() => fs.promises.readFile(missingFile, "utf8"));
});

/** @type {[string, string][]} */
const globsAndArgsMirror = [
  [
    "/virtual/.markdownlint-cli2.jsonc",
    "{\n  \"globs\": [\n    \"**/*.md\"\n  ]\n}\n"
  ],
  [
    "/virtual/dir/about.md",
    "#  About  #\n\nText text text\n1. List\n3. List\n3. List\n"
  ],
  [
    "/virtual/dir/subdir/info.markdown",
    "## Information\nText ` code1` text `code2 ` text\n\n"
  ],
  [
    "/virtual/viewme.md",
    "# Title\n\n> Tagline \n\n\n# Description\n\nText text text\nText text text\nText text text\n\n##  Summary\n\nText text text"
  ]
];

test("fsVirtual.updateFiles", async (t) => {
  t.plan(6);
  // @ts-ignore
  const fs = new FsVirtual();
  const fsReaddir = promisify(fs.readdir);
  // @ts-ignore
  const first = await fsReaddir("/");
  t.is(first.length, 0);
  fs.updateFiles([ [ "/file", "one" ] ]);
  const second = await fs.promises.readFile("/file", "utf8");
  t.is(second, "one");
  fs.updateFiles([ [ "/file", "two" ], [ "/dir/file", "three" ] ]);
  const third = await fs.promises.readFile("/file", "utf8");
  t.is(third, "two");
  const fourth = await fs.promises.readFile("/dir/file", "utf8");
  t.is(fourth, "three");
  // @ts-ignore
  const fifth = await fsReaddir("/");
  t.is(fifth.length, 2);
  // @ts-ignore
  const sixth = await fsReaddir("/dir");
  t.is(sixth.length, 1);
});

test("fsVirtual.mirrorDirectory", async (t) => {
  t.plan(1);
  const actual = await FsVirtual.mirrorDirectory(
    nodeFs,
    nodePath.join(__dirname(import.meta), "globs-and-args"),
    globby,
    "/virtual"
  );
  for (const entry of actual) {
    entry[1] = entry[1].replaceAll("\r\n", "\n");
  }
  t.deepEqual(actual, globsAndArgsMirror);
});

test("fsVirtual of mirror", async (t) => {
  t.plan(4);
  const fs = new FsVirtual(globsAndArgsMirror);
  for (const [ path, content ] of globsAndArgsMirror) {
    // eslint-disable-next-line no-await-in-loop
    t.is(await fs.promises.readFile(path, "utf8"), content);
  }
});

test("fsVirtual mirror of self", async (t) => {
  t.plan(1);
  const actual = await FsVirtual.mirrorDirectory(
    new FsVirtual(globsAndArgsMirror),
    "/",
    globby,
    ""
  );
  t.deepEqual(actual, globsAndArgsMirror);
});
