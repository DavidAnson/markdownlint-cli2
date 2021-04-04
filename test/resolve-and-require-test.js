// @ts-check

"use strict";

const test = require("ava").default;
const resolveAndRequire = require("../resolve-and-require");

test("built-in module", (t) => {
  t.plan(1);
  t.deepEqual(
    require("fs"),
    resolveAndRequire(require, "fs", __dirname)
  );
});

test("locally-installed module", (t) => {
  t.plan(1);
  t.deepEqual(
    require("markdownlint"),
    resolveAndRequire(require, "markdownlint", __dirname)
  );
});

test("relative path to module", (t) => {
  t.plan(1);
  t.deepEqual(
    require("./customRules/rules/npm"),
    resolveAndRequire(require, "./customRules/rules/npm", __dirname)
  );
});

test("locally-installed module when require.resolve.paths() missing", (t) => {
  t.plan(1);
  delete require.resolve.paths;
  t.deepEqual(
    require("markdownlint"),
    resolveAndRequire(require, "markdownlint", __dirname)
  );
});
