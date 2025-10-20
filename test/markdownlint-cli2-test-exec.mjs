// @ts-check

import fs from "node:fs/promises";
import path from "node:path";
import test from "ava";
import spawn from "nano-spawn";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import { __dirname } from "./esm-helpers.mjs";

const absolute = (/** @type {string} */ rootDir, /** @type {string} */ file) => path.join(rootDir, file);
const repositoryPath = (/** @type {string} */ name) => path.join(__dirname(import.meta), "..", name);

const invoke = (/** @type {string} */ directory, /** @type {string[]} */ args, /** @type {boolean} */ noImport, /** @type {Record<string, string>} */ env, /** @type {string} */ script) => async () => {
  await fs.access(directory);
  return spawn(
    "node",
    [
      repositoryPath(script || "markdownlint-cli2-bin.mjs"),
      ...args
    ],
    {
      "cwd": directory,
      "env": env || {}
    }
  ).
    then((subprocess) => ({
      ...subprocess,
      "exitCode": 0
    })).
    catch((error) => error);
};

testCases({
  "host": "exec",
  invoke,
  absolute,
  "includeNoImport": false,
  "includeEnv": true,
  "includeScript": true,
  "includeRequire": true,
  "includeAbsolute": true
});

// eslint-disable-next-line unicorn/no-useless-undefined
const invokeStdin = (/** @type {string[]} */ args, /** @type {string} */ stdin, /** @type {string | undefined} */ cwd = undefined) => (
  spawn(
    "node",
    [
      repositoryPath("markdownlint-cli2-bin.mjs"),
      ...args
    ],
    {
      cwd,
      "stdin": { "string": stdin }
    }
  )
);

const validInput = "# Heading\n\nText\n";
const invalidInput = "#  Heading\n\nText";

test("- parameter with empty input from stdin", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "-" ],
    ""
  ).
    then(() => t.pass()).
    catch(() => t.fail());
});

test("- parameter with valid input from stdin", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "-" ],
    validInput
  ).
    then(() => t.pass()).
    catch(() => t.fail());
});

test("- parameter with invalid input from stdin", (t) => {
  t.plan(2);
  return invokeStdin(
    [ "-" ],
    invalidInput
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^stdin:1:3 MD019\/.*$[\n\r]+^stdin:3:4 MD047\/.*$/mu, ""));
    });
});

test("- parameter with invalid input from stdin and --fix", (t) => {
  t.plan(2);
  return invokeStdin(
    [ "-", "--fix" ],
    invalidInput
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^stdin:1:3 MD019\/.*$[\n\r]+^stdin:3:4 MD047\/.*$/mu, ""));
    });
});

test("- parameter multiple times with invalid input", (t) => {
  t.plan(2);
  return invokeStdin(
    [ "-", "-" ],
    invalidInput
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^stdin:1:3 MD019\/.*$[\n\r]+^stdin:3:4 MD047\/.*$/mu, ""));
    });
});

test("- parameter with valid input combined with valid globs", (t) => {
  t.plan(1);
  return invokeStdin(
    [ repositoryPath("CONTRIBUTING.md"), "-", repositoryPath("README.md") ],
    validInput
  ).
    then(() => t.pass()).
    catch(() => t.fail());
});

test("- parameter with invalid input combined with valid globs", (t) => {
  t.plan(2);
  return invokeStdin(
    [ repositoryPath("CONTRIBUTING.md"), repositoryPath("README.md"), "-" ],
    invalidInput
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^stdin:1:3 MD019\/.*$[\n\r]+^stdin:3:4 MD047\/.*$/mu, ""));
    });
});

test("- parameter with invalid input combined with invalid glob", (t) => {
  t.plan(2);
  return invokeStdin(
    [ "-", repositoryPath("LICENSE") ],
    invalidInput
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^LICENSE:1 MD041\/.*$[\n\r]+^stdin:1:3 MD019\/.*$[\n\r]+^stdin:3:4 MD047\/.*$/mu, ""));
    });
});

test("- parameter uses base directory configuration", (t) => {
  t.plan(2);
  return invokeStdin(
    [ "-" ],
    invalidInput,
    path.join(__dirname(import.meta), "stdin")
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^stdin:1:3 MD019\/.*$/mu, ""));
    });
});

test("- parameter not treated as stdin in configuration file globs", (t) => {
  t.plan(1);
  return invokeStdin(
    [],
    invalidInput,
    path.join(__dirname(import.meta), "stdin-globs")
  ).
    then(() => t.pass()).
    catch(() => t.fail());
});

test("- parameter ignored after --", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--", "-" ],
    invalidInput
  ).
    then(() => t.pass()).
    catch(() => t.fail());
});

test("exit codes", (t) => {
  t.plan(19);
  return Promise.all([
    invokeStdin(
      [],
      validInput
    ).catch((error) => t.is(error.exitCode, 2)),
    invokeStdin(
      [ "-" ],
      validInput
    ).then((result) => t.notRegex(result.output, /MD\d{3}/su)),
    invokeStdin(
      [ "-" ],
      invalidInput
    ).catch((error) => {
      t.is(error.exitCode, 1);
      t.regex(error.output, /MD019.*MD047/su);
    }),
    invokeStdin(
      [ "-" ],
      `${invalidInput} <!-- markdownlint-configure-file { "default": false } -->`
    ).then((result) => t.notRegex(result.output, /MD\d{3}/su)),
    invokeStdin(
      [ "-" ],
      `${invalidInput} <!-- markdownlint-configure-file { "default": "warning" } -->`
    ).then((result) => t.regex(result.output, /MD019.*MD047/su)),
    invokeStdin(
      [ "-" ],
      `${invalidInput} <!-- markdownlint-configure-file { "default": "error" } -->`
    ).catch((error) => {
      t.is(error.exitCode, 1);
      t.regex(error.output, /MD019.*MD047/su);
    }),
    invokeStdin(
      [ "-" ],
      `${invalidInput} <!-- markdownlint-configure-file { "MD019": false } -->`
    ).catch((error) => {
      t.is(error.exitCode, 1);
      t.regex(error.output, /MD047/su);
    }),
    invokeStdin(
      [ "-" ],
      `${invalidInput} <!-- markdownlint-configure-file { "MD019": "warning" } -->`
    ).catch((error) => {
      t.is(error.exitCode, 1);
      t.regex(error.output, /MD019.*MD047/su);
    }),
    invokeStdin(
      [ "-" ],
      `${invalidInput} <!-- markdownlint-configure-file { "MD047": false } -->`
    ).catch((error) => {
      t.is(error.exitCode, 1);
      t.regex(error.output, /MD019/su);
    }),
    invokeStdin(
      [ "-" ],
      `${invalidInput} <!-- markdownlint-configure-file { "MD047": "warning" } -->`
    ).catch((error) => {
      t.is(error.exitCode, 1);
      t.regex(error.output, /MD019.*MD047/su);
    }),
    invokeStdin(
      [ "-" ],
      `${invalidInput} <!-- markdownlint-configure-file { "MD019": false, "MD047": false } -->`
    ).then((result) => t.notRegex(result.output, /MD\d{3}/su)),
    invokeStdin(
      [ "-" ],
      `${invalidInput} <!-- markdownlint-configure-file {"MD019":"warning","MD047":"warning"} -->`
    ).then((result) => t.regex(result.output, /MD019.*MD047/su))
  ]).
    then(() => t.pass()).
    catch(() => t.fail());
});
