// @ts-check

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "ava";
import packageJson from "../package.json" with { "type": "json" };
import markdownlintCli2ConfigSchema from "../schema/markdownlint-cli2-config-schema.json" with { "type": "json" };
import * as constants from "../constants.mjs";

// eslint-disable-next-line unicorn/prefer-json-parse-buffer
const libraryJson = JSON.parse(await fs.readFile(path.join(fileURLToPath(import.meta.resolve("markdownlint")), "..", "..", "package.json"), "utf8"));

test("package name and version", (t) => {
  t.plan(2);
  t.is(constants.packageName, packageJson.name);
  t.is(constants.packageVersion, packageJson.version);
});

test("library name and version", (t) => {
  t.plan(1);
  t.is(constants.libraryName, libraryJson.name);
});

test("CLI2 schema keys", (t) => {
  t.plan(1);
  const actual = [ ...constants.cli2SchemaKeys.keys() ].toSorted();
  const expected = Object.keys(markdownlintCli2ConfigSchema.properties).filter((key) => key !== "$schema").toSorted();
  t.deepEqual(actual, expected);
});
