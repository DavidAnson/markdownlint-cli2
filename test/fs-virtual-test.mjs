// @ts-check

import nodeFs from "node:fs";
import nodePath from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import * as globby from "globby";
import FsVirtual from "../webworker/fs-virtual.cjs";

const basePath = "/virtual";
const thisFile = nodePath.basename(import.meta.filename);
const testFile = nodePath.posix.join(basePath, thisFile);
const testDir = nodePath.posix.join(basePath, "dir");
const missingFile = `${basePath}/missing`;

/** @type {[string, string][]} */
const virtualFiles = [
  [ testFile, "// content" ],
  [ `${testDir}/placeholder`, "placeholder" ]
];

test.suite(import.meta.url.replace(/^.*?\/(?<name>[^/]*)$/u, "$<name>"), () => {

  test("fsVirtual.lstat", async (t) => {
    t.plan(15);
    const fs = new FsVirtual(virtualFiles);
    const fsLstat = promisify(fs.lstat);
    // @ts-ignore
    const statFile = await fsLstat(testFile);
    t.assert.equal(statFile.isBlockDevice(), false);
    t.assert.equal(statFile.isCharacterDevice(), false);
    t.assert.equal(statFile.isDirectory(), false);
    t.assert.equal(statFile.isFIFO(), false);
    t.assert.equal(statFile.isFile(), true);
    t.assert.equal(statFile.isSocket(), false);
    t.assert.equal(statFile.isSymbolicLink(), false);
    // @ts-ignore
    const statDir = await fsLstat(testDir);
    t.assert.equal(statDir.isBlockDevice(), false);
    t.assert.equal(statDir.isCharacterDevice(), false);
    t.assert.equal(statDir.isDirectory(), true);
    t.assert.equal(statDir.isFIFO(), false);
    t.assert.equal(statDir.isFile(), false);
    t.assert.equal(statDir.isSocket(), false);
    t.assert.equal(statDir.isSymbolicLink(), false);
    await t.assert.rejects(() => fsLstat(missingFile), /^Error:/u);
  });

  test("fsVirtual.readdir", async (t) => {
    t.plan(11);
    const fs = new FsVirtual(virtualFiles);
    const fsReaddir = promisify(fs.readdir);
    const expectedFiles = [ thisFile, "dir" ];
    // @ts-ignore
    t.assert.deepEqual(await fsReaddir(basePath), expectedFiles);
    // @ts-ignore
    t.assert.deepEqual(await fsReaddir(`${basePath}/`), expectedFiles);
    const expectedDir = [ basePath.replace(/^\//u, "") ];
    // @ts-ignore
    t.assert.deepEqual(await fsReaddir("/"), expectedDir);
    // @ts-ignore
    const [ direntFile ] = await fsReaddir(basePath, { "withFileTypes": true });
    if (typeof direntFile !== "string") {
      t.assert.equal(direntFile.name, expectedFiles[0]);
      t.assert.equal(direntFile.parentPath, basePath);
      t.assert.equal(direntFile.isFile(), true);
      t.assert.equal(direntFile.isDirectory(), false);
    }
    // @ts-ignore
    const [ direntDir ] = await fsReaddir("/", { "withFileTypes": true });
    if (typeof direntDir !== "string") {
      t.assert.equal(direntDir.name, expectedDir[0]);
      t.assert.equal(direntDir.parentPath, "/");
      t.assert.equal(direntDir.isFile(), false);
      t.assert.equal(direntDir.isDirectory(), true);
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
    t.assert.equal(content.length > 0, true);
    // @ts-ignore
    await t.assert.rejects(() => fsAccess(missingFile), /^Error:/u);
    // @ts-ignore
    await t.assert.rejects(() => fsReadFile(missingFile, "utf8"), /^Error:/u);
  });

  test("fsVirtual.promises.*", async (t) => {
    t.plan(3);
    const fs = new FsVirtual(virtualFiles);
    const tempName = "fs-virtual.tmp";
    const tempFile = nodePath.posix.join(basePath, tempName);
    await t.assert.rejects(() => fs.promises.access(tempFile), /^Error:/u);
    await fs.promises.writeFile(tempFile, tempFile, "utf8");
    await fs.promises.access(tempFile);
    await fs.promises.stat(tempFile);
    t.assert.equal(await fs.promises.readFile(tempFile, "utf8"), tempFile);
    await t.assert.rejects(() => fs.promises.readFile(missingFile, "utf8"), /^Error:/u);
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
    t.assert.equal(first.length, 0);
    fs.updateFiles([ [ "/file", "one" ] ]);
    const second = await fs.promises.readFile("/file", "utf8");
    t.assert.equal(second, "one");
    fs.updateFiles([ [ "/file", "two" ], [ "/dir/file", "three" ] ]);
    const third = await fs.promises.readFile("/file", "utf8");
    t.assert.equal(third, "two");
    const fourth = await fs.promises.readFile("/dir/file", "utf8");
    t.assert.equal(fourth, "three");
    // @ts-ignore
    const fifth = await fsReaddir("/");
    t.assert.equal(fifth.length, 2);
    // @ts-ignore
    const sixth = await fsReaddir("/dir");
    t.assert.equal(sixth.length, 1);
  });

  test("fsVirtual.mirrorDirectory", async (t) => {
    t.plan(1);
    const actual = await FsVirtual.mirrorDirectory(
      nodeFs,
      nodePath.join(import.meta.dirname, "globs-and-args"),
      globby,
      "/virtual"
    );
    for (const entry of actual) {
      entry[1] = entry[1].replaceAll("\r\n", "\n");
    }
    t.assert.deepEqual(actual, globsAndArgsMirror);
  });

  test("fsVirtual of mirror", async (t) => {
    t.plan(4);
    const fs = new FsVirtual(globsAndArgsMirror);
    for (const [ path, content ] of globsAndArgsMirror) {
      // eslint-disable-next-line no-await-in-loop
      t.assert.equal(await fs.promises.readFile(path, "utf8"), content);
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
    t.assert.deepEqual(actual, globsAndArgsMirror);
  });

  /** @type {[string, string][]} */
  const deletedFileMirror = [
    [
      "/file.txt",
      "[DELETED FILE]"
    ]
  ];

  /* eslint-disable jsdoc/no-undefined-types */

  class FsDeletedFile {
    constructor() {
      this.promises = {
        "readFile": () => Promise.reject(new Error("Deleted file."))
      };
      this.lstat = (/** @type {string} */ path, /** @type {((err: NodeJS.ErrnoException | null, stats: import("fs").Stats) => void)} */ callback) => {
        const stats = {};
        // @ts-ignore
        callback(null, stats);
      };
      this.readdir = (/** @type {string} */ path, /** @type {{ "withFileTypes": boolean}=} */ options, /** @type {((err: NodeJS.ErrnoException | null, names: (string | import("fs").Dirent)[]) => void)} */ callback) => {
        const dirent = {
          "isDirectory": () => false,
          "isFile": () => true,
          "isSymbolicLink": () => false,
          "name": "file.txt"
        };
        // @ts-ignore
        return (callback || options)(null, [ dirent ]);
      };
    }
  }

  test("fsVirtual mirror of deleted file", async (t) => {
    t.plan(1);
    const actual = await FsVirtual.mirrorDirectory(
      new FsDeletedFile(),
      "/",
      globby,
      ""
    );
    t.assert.deepEqual(actual, deletedFileMirror);
  });

});
