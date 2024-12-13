// @ts-check

import fs from "node:fs/promises";
import path from "node:path";
import test from "ava";
import spawn from "nano-spawn";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import { __dirname } from "./esm-helpers.mjs";

const absolute = (rootDir, file) => path.join(rootDir, file);
const repositoryPath = (name) => path.join(__dirname(import.meta), "..", name);

const invoke = (directory, args, noRequire, env, script) => async () => {
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
  "includeNoRequire": false,
  "includeEnv": true,
  "includeScript": true,
  "includeRequire": true,
  "includeAbsolute": true
});

const invokeStdin = (args, stdin, cwd) => (
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
