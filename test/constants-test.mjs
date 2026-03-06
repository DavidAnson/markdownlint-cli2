// @ts-check

import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "ava";
import { importWithTypeJson } from "./esm-helpers.mjs";
const packageJson = await importWithTypeJson(import.meta, "../package.json");
const libraryJson = await importWithTypeJson(
  import.meta,
  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  path.join(path.relative(import.meta.dirname, fileURLToPath(import.meta.resolve("markdownlint"))), "..", "..", "package.json")
);
import * as constants from "../constants.mjs";

test("package name and version", (t) => {
  t.plan(2);
  t.is(constants.packageName, packageJson.name);
  t.is(constants.packageVersion, packageJson.version);
});

test("library name and version", (t) => {
  t.plan(1);
  t.is(constants.libraryName, libraryJson.name);
});

test("CLI2 schema keys", async (t) => {
  t.plan(1);
  const schema = await importWithTypeJson(import.meta, "../schema/markdownlint-cli2-config-schema.json");
  const actual = [ ...constants.cli2SchemaKeys.keys() ].toSorted();
  const expected = Object.keys(schema.properties).filter((key) => key !== "$schema").toSorted();
  t.deepEqual(actual, expected);
});
