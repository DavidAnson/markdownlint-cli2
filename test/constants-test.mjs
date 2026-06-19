// @ts-check

import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
// eslint-disable-next-line @stylistic/quote-props
import packageJson from "../package.json" with { type: "json" };
// eslint-disable-next-line @stylistic/quote-props
import markdownlintCli2ConfigSchema from "../schema/markdownlint-cli2-config-schema.json" with { type: "json" };
import * as constants from "../constants.mjs";

const libraryJson = JSON.parse(await fs.readFile(path.join(fileURLToPath(import.meta.resolve("markdownlint")), "..", "..", "package.json"), "utf8"));

test.suite(import.meta.url.replace(/^.*?\/(?<name>[^/]*)$/u, "$<name>"), () => {

  test("package name and version", (t) => {
    t.plan(2);
    t.assert.equal(constants.packageName, packageJson.name);
    t.assert.equal(constants.packageVersion, packageJson.version);
  });

  test("library name and version", (t) => {
    t.plan(1);
    t.assert.equal(constants.libraryName, libraryJson.name);
  });

  test("CLI2 schema keys", (t) => {
    t.plan(1);
    // eslint-disable-next-line unicorn/require-array-sort-compare, unicorn/prefer-iterator-to-array
    const actual = [ ...constants.cli2SchemaKeys.keys() ].toSorted();
    // eslint-disable-next-line unicorn/require-array-sort-compare
    const expected = Object.keys(markdownlintCli2ConfigSchema.properties).filter((key) => key !== "$schema").toSorted();
    t.assert.deepEqual(actual, expected);
  });

});
