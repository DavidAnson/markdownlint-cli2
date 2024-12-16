// @ts-check

import test from "ava";
import path from "node:path";
import { __dirname } from "./esm-helpers.mjs";
import resolve from "../resolve-module.mjs";

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

test("built-in module", (t) => {
  t.plan(1);
  t.deepEqual(
    require.resolve("node:fs"),
    resolve(require, "node:fs", [ __dirname(import.meta) ])
  );
});

test("locally-installed module", (t) => {
  t.plan(1);
  t.deepEqual(
    require.resolve("micromatch"),
    resolve(require, "micromatch", [ __dirname(import.meta) ])
  );
});

test("relative (to __dirname(import.meta)) path to module", (t) => {
  t.plan(1);
  t.deepEqual(
    require.resolve("./customRules/node_modules/markdownlint-rule-sample-commonjs"),
    resolve(
      require,
      "./customRules/node_modules/markdownlint-rule-sample-commonjs",
      [ __dirname(import.meta) ]
    )
  );
});

test("module in alternate node_modules", (t) => {
  t.plan(2);
  t.throws(
    // @ts-ignore
    () => require.resolve("markdownlint-rule-sample-commonjs"),
    { "code": "MODULE_NOT_FOUND" }
  );
  t.deepEqual(
    require.resolve("./customRules/node_modules/markdownlint-rule-sample-commonjs"),
    resolve(
      require,
      "markdownlint-rule-sample-commonjs",
      [ path.join(__dirname(import.meta), "customRules") ]
    )
  );
});

test("module in alternate node_modules and no require.resolve.paths", (t) => {
  t.plan(2);
  // @ts-ignore
  delete require.resolve.paths;
  t.throws(
    // @ts-ignore
    () => require.resolve("markdownlint-rule-sample-commonjs"),
    { "code": "MODULE_NOT_FOUND" }
  );
  t.deepEqual(
    require.resolve("./customRules/node_modules/markdownlint-rule-sample-commonjs"),
    resolve(
      require,
      "markdownlint-rule-sample-commonjs",
      [ path.join(__dirname(import.meta), "customRules") ]
    )
  );
});

test("module local, relative, and in alternate node_modules", (t) => {
  t.plan(3);
  const dirs = [
    __dirname(import.meta),
    path.join(__dirname(import.meta), "customRules")
  ];
  t.deepEqual(
    require.resolve("micromatch"),
    resolve(require, "micromatch", dirs)
  );
  t.deepEqual(
    require.resolve("./customRules/node_modules/markdownlint-rule-sample-commonjs"),
    resolve(
      require,
      "./customRules/node_modules/markdownlint-rule-sample-commonjs",
      dirs
    )
  );
  t.deepEqual(
    require.resolve("./customRules/node_modules/markdownlint-rule-sample-commonjs"),
    resolve(
      require,
      "markdownlint-rule-sample-commonjs",
      dirs
    )
  );
});
