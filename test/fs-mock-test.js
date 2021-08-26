// @ts-check

"use strict";

const path = require("path");
const test = require("ava").default;
const FsMock = require("./fs-mock");

const mockPath = "/mock";
const testFile = path.basename(__filename);

test.cb("fsMock.stat", (t) => {
  t.plan(3);
  const fs = new FsMock(__dirname);
  fs.stat(path.join(mockPath, testFile), (err, stat) => {
    t.is(err, null);
    t.truthy(stat);
    t.true(stat.size > 0);
    t.end();
  });
});

test.cb("fsMock.lstat", (t) => {
  t.plan(4);
  const fs = new FsMock(__dirname);
  fs.lstat(path.join(mockPath, testFile), (err, stat) => {
    t.is(err, null);
    t.truthy(stat);
    t.true(stat.size > 0);
    t.false(stat.isSymbolicLink());
    t.end();
  });
});

test.cb("fsMock.lstat symbolic links", (t) => {
  t.plan(4);
  const fs = new FsMock(__dirname, true);
  fs.lstat(path.join(mockPath, testFile), (err, stat) => {
    t.is(err, null);
    t.truthy(stat);
    t.true(stat.size > 0);
    t.true(stat.isSymbolicLink());
    t.end();
  });
});

test.cb("fsMock.readdir", (t) => {
  t.plan(4);
  const fs = new FsMock(__dirname);
  fs.readdir(mockPath, (err, files) => {
    t.is(err, null);
    t.true(Array.isArray(files));
    t.true(files.length > 0);
    t.true(files.includes(testFile));
    t.end();
  });
});

test("fsMock.promises.*", async (t) => {
  t.plan(2);
  const fs = new FsMock(__dirname);
  const tempName = "fs-mock.tmp";
  const tempFile = path.join(mockPath, tempName);
  t.throwsAsync(() => fs.promises.access(tempFile));
  await fs.promises.writeFile(tempFile, tempFile, "utf8");
  await fs.promises.access(tempFile);
  await fs.promises.stat(tempFile);
  t.is(await fs.promises.readFile(tempFile, "utf8"), tempFile);
  await require("fs").promises.unlink(path.join(__dirname, tempName));
});
