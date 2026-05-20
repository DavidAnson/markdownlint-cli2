// @ts-check

import path from "node:path";
import test from "node:test";
import { execa } from "execa";

const baseDir = import.meta.dirname;

const repositoryPath = (/** @type {string} */ name) => path.join(baseDir, "..", name);

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

test.suite(import.meta.url.replace(/^.*?(?<name>[^/]*)$/u, "$<name>"), () => {

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
      then(() => t.assert.ok(true)).
      catch(() => t.assert.fail());
  });

  test("- parameter with valid input from stdin", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "-" ],
      inputWithNoIssues
    ).
      then(() => t.assert.ok(true)).
      catch(() => t.assert.fail());
  });

  test("- parameter with invalid input from stdin", (t) => {
    t.plan(2);
    return invokeStdin(
      [ "-" ],
      inputWithFixableIssues
    ).
      then(() => t.assert.fail()).
      catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.equal("", error.stderr.replace(/^stdin:1:3 error MD019\/.*$[\n\r]+^stdin:3:4 error MD047\/.*$/msu, ""));
      });
  });

  test("- parameter with invalid input from stdin and --fix reports existing issues", (t) => {
    t.plan(2);
    return invokeStdin(
      [ "-", "--fix" ],
      inputWithFixableIssues
    ).
      then(() => t.assert.fail()).
      catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.equal("", error.stderr.replace(/^stdin:1:3 error MD019\/.*$[\n\r]+^stdin:3:4 error MD047\/.*$/msu, ""));
      });
  });

  test("- parameter multiple times with invalid input", (t) => {
    t.plan(2);
    return invokeStdin(
      [ "-", "-" ],
      inputWithFixableIssues
    ).
      then(() => t.assert.fail()).
      catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.equal("", error.stderr.replace(/^stdin:1:3 error MD019\/.*$[\n\r]+^stdin:3:4 error MD047\/.*$/msu, ""));
      });
  });

  test("- parameter with valid input combined with valid globs", (t) => {
    t.plan(1);
    return invokeStdin(
      [ repositoryPath("CONTRIBUTING.md"), "-", repositoryPath("README.md") ],
      inputWithNoIssues
    ).
      then(() => t.assert.ok(true)).
      catch(() => t.assert.fail());
  });

  test("- parameter with invalid input combined with valid globs", (t) => {
    t.plan(2);
    return invokeStdin(
      [ repositoryPath("CONTRIBUTING.md"), repositoryPath("README.md"), "-" ],
      inputWithFixableIssues
    ).
      then(() => t.assert.fail()).
      catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.equal("", error.stderr.replace(/^stdin:1:3 error MD019\/.*$[\n\r]+^stdin:3:4 error MD047\/.*$/msu, ""));
      });
  });

  test("- parameter with invalid input combined with invalid glob", (t) => {
    t.plan(2);
    return invokeStdin(
      [ "-", repositoryPath("LICENSE") ],
      inputWithFixableIssues
    ).
      then(() => t.assert.fail()).
      catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.equal("", error.stderr.replace(/^\.\.\/LICENSE:1 error MD041\/.*$[\n\r]+^stdin:1:3 error MD019\/.*$[\n\r]+^stdin:3:4 error MD047\/.*$/msu, ""));
      });
  });

  test("- parameter uses base directory configuration", (t) => {
    t.plan(2);
    return invokeStdin(
      [ "-" ],
      inputWithFixableIssues,
      path.join(baseDir, "stdin")
    ).
      then(() => t.assert.fail()).
      catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.equal("", error.stderr.replace(/^stdin:1:3 error MD019\/.*$/msu, ""));
      });
  });

  test("- parameter with --config behaves correctly", (t) => {
    t.plan(2);
    return invokeStdin(
      [ "-", "--config", path.join(baseDir, "stdin", ".markdownlint.jsonc") ],
      inputWithFixableIssues
    ).
      then(() => t.assert.fail()).
      catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.equal("", error.stderr.replace(/^stdin:1:3 error MD019\/.*$/msu, ""));
      });
  });

  test("- parameter not treated as stdin in configuration file globs", (t) => {
    t.plan(1);
    return invokeStdin(
      [],
      inputWithFixableIssues,
      path.join(baseDir, "stdin-globs")
    ).
      then(() => t.assert.ok(true)).
      catch(() => t.assert.fail());
  });

  test("- parameter ignored after --", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "--", "-" ],
      inputWithFixableIssues
    ).
      then(() => t.assert.ok(true)).
      catch(() => t.assert.fail());
  });

  test("--format of empty input produces same output", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "--format" ],
      ""
    ).
      then((result) => t.assert.equal(result.all, "")).
      catch(() => t.assert.fail());
  });

  test("--format of input with no issues produces same output", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "--format" ],
      inputWithNoIssues
    ).
      then((result) => t.assert.equal(result.all, inputWithNoIssues)).
      catch(() => t.assert.fail());
  });

  test("--format of input with all fixable issues produces output with no issues", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "--format" ],
      inputWithFixableIssues
    ).
      then((result) => t.assert.equal(result.all, inputWithNoIssues)).
      catch(() => t.assert.fail());
  });

  test("--format of input with no fixable issues produces same output", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "--format" ],
      inputWithUnfixableIssues
    ).
      then((result) => t.assert.equal(result.all, inputWithUnfixableIssues)).
      catch(() => t.assert.fail());
  });

  test("--format of input with some fixable issues produces output with unfixable issues", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "--format" ],
      inputWithSomeFixableIssues
    ).
      then((result) => t.assert.equal(result.all, inputWithUnfixableIssues)).
      catch(() => t.assert.fail());
  });

  test("--format with globs behaves the same", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "--format", path.join(baseDir, "no-config", "viewme.md") ],
      inputWithSomeFixableIssues
    ).
      then((result) => t.assert.equal(result.all, inputWithUnfixableIssues)).
      catch(() => t.assert.fail());
  });

  test("--format with --fix behaves the same", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "--format", "--fix" ],
      inputWithSomeFixableIssues
    ).
      then((result) => t.assert.equal(result.all, inputWithUnfixableIssues)).
      catch(() => t.assert.fail());
  });

  test("--format with - behaves the same", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "--format", "-" ],
      inputWithSomeFixableIssues
    ).
      then((result) => t.assert.equal(result.all, inputWithUnfixableIssues)).
      catch(() => t.assert.fail());
  });

  test("--format uses base directory configuration", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "--format" ],
      inputWithSomeFixableIssues,
      path.join(baseDir, "stdin")
    ).
      then((result) => t.assert.equal(result.all, inputWithUnfixableIssues.slice(0, -1))).
      catch(() => t.assert.fail());
  });

  test("--format with base directory configuration ignores globs", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "--format" ],
      inputWithSomeFixableIssues,
      path.join(baseDir, "globs")
    ).
      then((result) => t.assert.equal(result.all, inputWithUnfixableIssues)).
      catch(() => t.assert.fail());
  });

  test("--format with --config behaves correctly", (t) => {
    t.plan(1);
    return invokeStdin(
      [ "--format", "--config", path.join(baseDir, "stdin", ".markdownlint.jsonc") ],
      inputWithSomeFixableIssues
    ).
      then((result) => t.assert.equal(result.all, inputWithUnfixableIssues.slice(0, -1))).
      catch(() => t.assert.fail());
  });

  test("exit codes", (t) => {
    t.plan(19);
    return Promise.all([
      invokeStdin(
        [],
        inputWithNoIssues
      ).catch((error) => t.assert.equal(error.exitCode, 2)),
      invokeStdin(
        [ "-" ],
        inputWithNoIssues
      ).then((result) => t.assert.doesNotMatch(result.all, /MD\d{3}/su)),
      invokeStdin(
        [ "-" ],
        inputWithFixableIssues
      ).catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.match(error.all, /MD019.*MD047/su);
      }),
      invokeStdin(
        [ "-" ],
        `${inputWithFixableIssues} <!-- markdownlint-configure-file { "default": false } -->`
      ).then((result) => t.assert.doesNotMatch(result.all, /MD\d{3}/su)),
      invokeStdin(
        [ "-" ],
        `${inputWithFixableIssues} <!-- markdownlint-configure-file { "default": "warning" } -->`
      ).then((result) => t.assert.match(result.all, /MD019.*MD047/su)),
      invokeStdin(
        [ "-" ],
        `${inputWithFixableIssues} <!-- markdownlint-configure-file { "default": "error" } -->`
      ).catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.match(error.all, /MD019.*MD047/su);
      }),
      invokeStdin(
        [ "-" ],
        `${inputWithFixableIssues} <!-- markdownlint-configure-file { "MD019": false } -->`
      ).catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.match(error.all, /MD047/su);
      }),
      invokeStdin(
        [ "-" ],
        `${inputWithFixableIssues} <!-- markdownlint-configure-file { "MD019": "warning" } -->`
      ).catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.match(error.all, /MD019.*MD047/su);
      }),
      invokeStdin(
        [ "-" ],
        `${inputWithFixableIssues} <!-- markdownlint-configure-file { "MD047": false } -->`
      ).catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.match(error.all, /MD019/su);
      }),
      invokeStdin(
        [ "-" ],
        `${inputWithFixableIssues} <!-- markdownlint-configure-file { "MD047": "warning" } -->`
      ).catch((error) => {
        t.assert.equal(error.exitCode, 1);
        t.assert.match(error.all, /MD019.*MD047/su);
      }),
      invokeStdin(
        [ "-" ],
        `${inputWithFixableIssues} <!-- markdownlint-configure-file { "MD019": false, "MD047": false } -->`
      ).then((result) => t.assert.doesNotMatch(result.all, /MD\d{3}/su)),
      invokeStdin(
        [ "-" ],
        `${inputWithFixableIssues} <!-- markdownlint-configure-file {"MD019":"warning","MD047":"warning"} -->`
      ).then((result) => t.assert.match(result.all, /MD019.*MD047/su))
    ]).
      then(() => t.assert.ok(true)).
      catch(() => t.assert.fail());
  });

});
