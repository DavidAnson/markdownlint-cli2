// @ts-check

import fs from "node:fs/promises";
import path from "node:path";
import test from "ava";
import { execa } from "execa";
import { __dirname } from "./esm-helpers.mjs";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import { copyDir, removeDir } from "./markdownlint-cli2-test-helpers.mjs";

const baseDir = __dirname(import.meta);

const repositoryPath = (/** @type {string} */ name) => path.join(baseDir, "..", name);

const invoke = (/** @type {string} */ relative, /** @type {string[]} */ args, /** @type {boolean | undefined} */ noImport, /** @type {Record<string, string> | undefined} */ env, /** @type {string | undefined} */ script) => async () => {
  const directory = path.join(baseDir, relative);
  await fs.access(directory);
  return execa(
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
  baseDir,
  invoke,
  copyDir,
  removeDir,
  "includeNoImport": false,
  "includeEnv": true,
  "includeScript": true,
  "includeRequire": true
});

// eslint-disable-next-line unicorn/no-useless-undefined
const invokeStdin = (/** @type {string[]} */ args, /** @type {string} */ stdin, /** @type {string | undefined} */ cwd = undefined) => (
  execa(
    "node",
    [
      repositoryPath("markdownlint-cli2-bin.mjs"),
      ...args
    ],
    {
      "all": true,
      "cwd": cwd || baseDir,
      "input": stdin,
      "stripFinalNewline": false
    }
  )
);

const inputWithNoIssues = "# Heading\n\nText\n";
const inputWithFixableIssues = "#  Heading\n\nText";
const inputWithUnfixableIssues = "# Heading\n\nInline <br> HTML\n\n## Heading\n";
const inputWithSomeFixableIssues = "#  Heading\n\nInline <br> HTML\n\n## Heading";

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
    inputWithNoIssues
  ).
    then(() => t.pass()).
    catch(() => t.fail());
});

test("- parameter with invalid input from stdin", (t) => {
  t.plan(2);
  return invokeStdin(
    [ "-" ],
    inputWithFixableIssues
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^stdin:1:3 error MD019\/.*$[\n\r]+^stdin:3:4 error MD047\/.*$/msu, ""));
    });
});

test("- parameter with invalid input from stdin and --fix reports existing issues", (t) => {
  t.plan(2);
  return invokeStdin(
    [ "-", "--fix" ],
    inputWithFixableIssues
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^stdin:1:3 error MD019\/.*$[\n\r]+^stdin:3:4 error MD047\/.*$/msu, ""));
    });
});

test("- parameter multiple times with invalid input", (t) => {
  t.plan(2);
  return invokeStdin(
    [ "-", "-" ],
    inputWithFixableIssues
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^stdin:1:3 error MD019\/.*$[\n\r]+^stdin:3:4 error MD047\/.*$/msu, ""));
    });
});

test("- parameter with valid input combined with valid globs", (t) => {
  t.plan(1);
  return invokeStdin(
    [ repositoryPath("CONTRIBUTING.md"), "-", repositoryPath("README.md") ],
    inputWithNoIssues
  ).
    then(() => t.pass()).
    catch(() => t.fail());
});

test("- parameter with invalid input combined with valid globs", (t) => {
  t.plan(2);
  return invokeStdin(
    [ repositoryPath("CONTRIBUTING.md"), repositoryPath("README.md"), "-" ],
    inputWithFixableIssues
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^stdin:1:3 error MD019\/.*$[\n\r]+^stdin:3:4 error MD047\/.*$/msu, ""));
    });
});

test("- parameter with invalid input combined with invalid glob", (t) => {
  t.plan(2);
  return invokeStdin(
    [ "-", repositoryPath("LICENSE") ],
    inputWithFixableIssues
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^\.\.\/LICENSE:1 error MD041\/.*$[\n\r]+^stdin:1:3 error MD019\/.*$[\n\r]+^stdin:3:4 error MD047\/.*$/msu, ""));
    });
});

test("- parameter uses base directory configuration", (t) => {
  t.plan(2);
  return invokeStdin(
    [ "-" ],
    inputWithFixableIssues,
    path.join(baseDir, "stdin")
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^stdin:1:3 error MD019\/.*$/msu, ""));
    });
});

test("- parameter with --config behaves correctly", (t) => {
  t.plan(2);
  return invokeStdin(
    [ "-", "--config", path.join(baseDir, "stdin", ".markdownlint.jsonc") ],
    inputWithFixableIssues
  ).
    then(() => t.fail()).
    catch((error) => {
      t.is(error.exitCode, 1);
      t.is("", error.stderr.replace(/^stdin:1:3 error MD019\/.*$/msu, ""));
    });
});

test("- parameter not treated as stdin in configuration file globs", (t) => {
  t.plan(1);
  return invokeStdin(
    [],
    inputWithFixableIssues,
    path.join(baseDir, "stdin-globs")
  ).
    then(() => t.pass()).
    catch(() => t.fail());
});

test("- parameter ignored after --", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--", "-" ],
    inputWithFixableIssues
  ).
    then(() => t.pass()).
    catch(() => t.fail());
});

test("--format of empty input produces same output", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--format" ],
    ""
  ).
    then((result) => t.is(result.all, "")).
    catch(() => t.fail());
});

test("--format of input with no issues produces same output", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--format" ],
    inputWithNoIssues
  ).
    then((result) => t.is(result.all, inputWithNoIssues)).
    catch(() => t.fail());
});

test("--format of input with all fixable issues produces output with no issues", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--format" ],
    inputWithFixableIssues
  ).
    then((result) => t.is(result.all, inputWithNoIssues)).
    catch(() => t.fail());
});

test("--format of input with no fixable issues produces same output", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--format" ],
    inputWithUnfixableIssues
  ).
    then((result) => t.is(result.all, inputWithUnfixableIssues)).
    catch(() => t.fail());
});

test("--format of input with some fixable issues produces output with unfixable issues", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--format" ],
    inputWithSomeFixableIssues
  ).
    then((result) => t.is(result.all, inputWithUnfixableIssues)).
    catch(() => t.fail());
});

test("--format with globs behaves the same", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--format", path.join(baseDir, "no-config", "viewme.md") ],
    inputWithSomeFixableIssues
  ).
    then((result) => t.is(result.all, inputWithUnfixableIssues)).
    catch(() => t.fail());
});

test("--format with --fix behaves the same", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--format", "--fix" ],
    inputWithSomeFixableIssues
  ).
    then((result) => t.is(result.all, inputWithUnfixableIssues)).
    catch(() => t.fail());
});

test("--format with - behaves the same", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--format", "-" ],
    inputWithSomeFixableIssues
  ).
    then((result) => t.is(result.all, inputWithUnfixableIssues)).
    catch(() => t.fail());
});

test("--format uses base directory configuration", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--format" ],
    inputWithSomeFixableIssues,
    path.join(baseDir, "stdin")
  ).
    then((result) => t.is(result.all, inputWithUnfixableIssues.slice(0, -1))).
    catch(() => t.fail());
});

test("--format with base directory configuration ignores globs", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--format" ],
    inputWithSomeFixableIssues,
    path.join(baseDir, "globs")
  ).
    then((result) => t.is(result.all, inputWithUnfixableIssues)).
    catch(() => t.fail());
});

test("--format with --config behaves correctly", (t) => {
  t.plan(1);
  return invokeStdin(
    [ "--format", "--config", path.join(baseDir, "stdin", ".markdownlint.jsonc") ],
    inputWithSomeFixableIssues
  ).
    then((result) => t.is(result.all, inputWithUnfixableIssues.slice(0, -1))).
    catch(() => t.fail());
});

test("exit codes", (t) => {
  t.plan(19);
  return Promise.all([
    invokeStdin(
      [],
      inputWithNoIssues
    ).catch((error) => t.is(error.exitCode, 2)),
    invokeStdin(
      [ "-" ],
      inputWithNoIssues
    ).then((result) => t.notRegex(result.all, /MD\d{3}/su)),
    invokeStdin(
      [ "-" ],
      inputWithFixableIssues
    ).catch((error) => {
      t.is(error.exitCode, 1);
      t.regex(error.all, /MD019.*MD047/su);
    }),
    invokeStdin(
      [ "-" ],
      `${inputWithFixableIssues} <!-- markdownlint-configure-file { "default": false } -->`
    ).then((result) => t.notRegex(result.all, /MD\d{3}/su)),
    invokeStdin(
      [ "-" ],
      `${inputWithFixableIssues} <!-- markdownlint-configure-file { "default": "warning" } -->`
    ).then((result) => t.regex(result.all, /MD019.*MD047/su)),
    invokeStdin(
      [ "-" ],
      `${inputWithFixableIssues} <!-- markdownlint-configure-file { "default": "error" } -->`
    ).catch((error) => {
      t.is(error.exitCode, 1);
      t.regex(error.all, /MD019.*MD047/su);
    }),
    invokeStdin(
      [ "-" ],
      `${inputWithFixableIssues} <!-- markdownlint-configure-file { "MD019": false } -->`
    ).catch((error) => {
      t.is(error.exitCode, 1);
      t.regex(error.all, /MD047/su);
    }),
    invokeStdin(
      [ "-" ],
      `${inputWithFixableIssues} <!-- markdownlint-configure-file { "MD019": "warning" } -->`
    ).catch((error) => {
      t.is(error.exitCode, 1);
      t.regex(error.all, /MD019.*MD047/su);
    }),
    invokeStdin(
      [ "-" ],
      `${inputWithFixableIssues} <!-- markdownlint-configure-file { "MD047": false } -->`
    ).catch((error) => {
      t.is(error.exitCode, 1);
      t.regex(error.all, /MD019/su);
    }),
    invokeStdin(
      [ "-" ],
      `${inputWithFixableIssues} <!-- markdownlint-configure-file { "MD047": "warning" } -->`
    ).catch((error) => {
      t.is(error.exitCode, 1);
      t.regex(error.all, /MD019.*MD047/su);
    }),
    invokeStdin(
      [ "-" ],
      `${inputWithFixableIssues} <!-- markdownlint-configure-file { "MD019": false, "MD047": false } -->`
    ).then((result) => t.notRegex(result.all, /MD\d{3}/su)),
    invokeStdin(
      [ "-" ],
      `${inputWithFixableIssues} <!-- markdownlint-configure-file {"MD019":"warning","MD047":"warning"} -->`
    ).then((result) => t.regex(result.all, /MD019.*MD047/su))
  ]).
    then(() => t.pass()).
    catch(() => t.fail());
});
