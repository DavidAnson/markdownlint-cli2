// @ts-check

"use strict";

const fs = require("fs").promises;
const path = require("path");
const cpy = require("cpy");
const del = require("del");
const execa = require("execa");
const tape = require("tape");
require("tape-player");

const crRe = /\r/gu;
const verRe = /\b\d+\.\d+\.\d+\b/u;
const noop = () => null;
const empty = () => "";

const testCase = (options) => {
  const { name, args, exitCode, cwd, stderrRe, pre, post } = options;
  tape(name, (test) => {
    test.plan(5);
    Promise.all([
      ((pre || noop)(name) || Promise.resolve()).
        then(() => execa.node(
          path.join(__dirname, "..", "markdownlint-cli2.js"),
          args,
          {
            "cwd": path.join(__dirname, `${cwd || name}`),
            "reject": false,
            "stripFinalNewline": false
          }
        )),
      fs.readFile(
        path.join(__dirname, `${name}.stdout`),
        "utf8"
      ).catch(empty),
      fs.readFile(
        path.join(__dirname, `${name}.stderr`),
        "utf8"
      ).catch(empty),
      fs.readFile(
        path.join(__dirname, `${name}.formatter.json`),
        "utf8"
      ).catch(empty),
      fs.readFile(
        path.join(__dirname, `${name}.formatter.junit`),
        "utf8"
      ).catch(empty)
    ]).then((results) => Promise.all([
      fs.readFile(
        path.join(__dirname, name, "markdownlint-cli2-results.json"),
        "utf8"
      ).catch(empty),
      fs.readFile(
        path.join(__dirname, name, "custom-name.json"),
        "utf8"
      ).catch(empty),
      fs.readFile(
        path.join(__dirname, name, "markdownlint-cli2-junit.xml"),
        "utf8"
      ).catch(empty),
      fs.readFile(
        path.join(__dirname, name, "custom-name.xml"),
        "utf8"
      ).catch(empty)
    ]).then((output) => [ ...results, ...output ])
    ).
      then(
        (results) => Promise.all([
          (post || noop)(name),
          new Promise((resolve) => {
            const [
              child,
              stdout,
              stderr,
              formatterJson,
              formatterJunit,
              formatterOutputJson,
              formatterOutputJsonCustom,
              formatterOutputJunit,
              formatterOutputJunitCustom
            ] = results;
            test.equal(child.exitCode, exitCode);
            test.equal(
              child.stdout.replace(verRe, "X.Y.Z"),
              stdout.replace(crRe, ""));
            if (stderrRe) {
              test.match(child.stderr, stderrRe);
            } else {
              test.equal(
                child.stderr.replace(verRe, "X.Y.Z"),
                stderr.replace(crRe, ""));
            }
            test.equal(
              (formatterOutputJson || formatterOutputJsonCustom).
                replace(crRe, ""),
              formatterJson.replace(crRe, ""));
            test.equal(
              (formatterOutputJunit || formatterOutputJunitCustom).
                replace(crRe, ""),
              formatterJunit.replace(crRe, ""));
            resolve();
          })
        ])
      );
  });
};

const copyDirectory = (dir) => {
  const target = path.join("..", `${dir}-copy`);
  return cpy([ "**/*", "**/.*" ], target, {
    "cwd": path.join(__dirname, dir),
    "parents": true
  });
};

const deleteDirectory = (dir) => {
  const target = `${dir}-copy`;
  return del(path.join(__dirname, target));
};

testCase({
  "name": "no-arguments",
  "args": [],
  "exitCode": 1,
  "cwd": "no-config"
});

testCase({
  "name": "all-ok",
  "args": [ "**/*.md", "**/*.markdown" ],
  "exitCode": 0
});

testCase({
  "name": "no-config",
  "args": [ "**" ],
  "exitCode": 1
});

testCase({
  "name": "no-config-ignore",
  "args": [ "**", "!dir" ],
  "exitCode": 1,
  "cwd": "no-config"
});

testCase({
  "name": "no-config-unignore",
  "args": [ "**", "!dir", "dir/subdir" ],
  "exitCode": 1,
  "cwd": "no-config"
});

testCase({
  "name": "no-config-ignore-hash",
  "args": [ "**", "#dir" ],
  "exitCode": 1,
  "cwd": "no-config"
});

testCase({
  "name": "file-paths-as-args",
  "args": [ "viewme.md", "./dir/subdir/info.md" ],
  "exitCode": 1,
  "cwd": "no-config"
});

testCase({
  "name": "dot",
  "args": [ "." ],
  "exitCode": 1
});

testCase({
  "name": "markdownlint-json",
  "args": [ "**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "markdownlint-json-extends",
  "args": [ "**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "markdownlint-jsonc",
  "args": [ "**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "markdownlint-yaml",
  "args": [ "**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "markdownlint-yml",
  "args": [ "**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "markdownlint-json-yaml",
  "args": [ "**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "markdownlint-json-invalid",
  "args": [ ".*" ],
  "exitCode": 2,
  "stderrRe": /Unexpected end of JSON input/u
});

testCase({
  "name": "markdownlint-yaml-invalid",
  "args": [ ".*" ],
  "exitCode": 2,
  "stderrRe": /Map keys must be unique/u
});

testCase({
  "name": "markdownlint-cli2-jsonc",
  "args": [ "**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "markdownlint-cli2-jsonc-example",
  "args": [ "**/*.md" ],
  "exitCode": 1,
  "cwd": "markdownlint-cli2-jsonc-example-copy",
  "pre": copyDirectory,
  "post": deleteDirectory
});

testCase({
  "name": "markdownlint-cli2-jsonc-invalid",
  "args": [ ".*" ],
  "exitCode": 2,
  "stderrRe": /Unexpected end of JSON input/u
});

testCase({
  "name": "config-overrides-options",
  "args": [ "viewme.md" ],
  "exitCode": 1
});

testCase({
  "name": "ignores",
  "args": [ "**/*.md", "**/*.markdown" ],
  "exitCode": 1
});

testCase({
  "name": "sibling-directory",
  "args": [ "../markdownlint-json/**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "sibling-directory-options",
  "args": [ "../no-config/**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "noInlineConfig",
  "args": [ "**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "frontMatter",
  "args": [ "**/*.md" ],
  "exitCode": 0
});

testCase({
  "name": "fix",
  "args": [ "**/*.md" ],
  "exitCode": 1,
  "cwd": "fix-copy",
  "pre": copyDirectory,
  "post": deleteDirectory
});

testCase({
  "name": "customRules",
  "args": [ "**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "customRules-missing",
  "args": [ ".*" ],
  "exitCode": 2,
  "stderrRe": /Cannot find module 'missing-package'/u
});

testCase({
  "name": "customRules-invalid",
  "args": [ ".*" ],
  "exitCode": 2,
  "stderrRe": /Property 'names' of custom rule at index 0 is incorrect\./u
});

testCase({
  "name": "customRules-throws",
  "args": [ "**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "markdownItPlugins",
  "args": [ "**/*.md" ],
  "exitCode": 1
});

testCase({
  "name": "markdownItPlugins-missing",
  "args": [ ".*" ],
  "exitCode": 2,
  "stderrRe": /Cannot find module 'missing-package'/u
});

testCase({
  "name": "outputFormatters",
  "args": [ "**/*.md" ],
  "exitCode": 1,
  "post": (dir) => Promise.all([
    fs.unlink(
      path.join(__dirname, dir, "markdownlint-cli2-results.json")
    ),
    fs.unlink(
      path.join(__dirname, dir, "markdownlint-cli2-junit.xml")
    )
  ])
});

testCase({
  "name": "outputFormatters-npm",
  "args": [ "**/*.md" ],
  "exitCode": 1,
  "post": (dir) => Promise.all([
    fs.unlink(
      path.join(__dirname, dir, "markdownlint-cli2-results.json")
    ),
    fs.unlink(
      path.join(__dirname, dir, "markdownlint-cli2-junit.xml")
    )
  ])
});

testCase({
  "name": "outputFormatters-params",
  "args": [ "**/*.md" ],
  "exitCode": 1,
  "post": (dir) => Promise.all([
    fs.unlink(path.join(__dirname, dir, "custom-name.json")),
    fs.unlink(path.join(__dirname, dir, "custom-name.xml"))
  ])
});

testCase({
  "name": "outputFormatters-clean",
  "args": [ "**/*.md" ],
  "exitCode": 0,
  "post": (dir) => Promise.all([
    fs.unlink(
      path.join(__dirname, dir, "markdownlint-cli2-results.json")
    ),
    fs.unlink(
      path.join(__dirname, dir, "markdownlint-cli2-junit.xml")
    )
  ])
});

testCase({
  "name": "outputFormatters-missing",
  "args": [ ".*" ],
  "exitCode": 2,
  "stderrRe": /Cannot find module 'missing-package'/u
});

testCase({
  "name": "nested-files",
  "args": [ "**/*.md" ],
  "exitCode": 1
});

tape("READMEs", (test) => {
  test.plan(1);
  const markdownlintCli2 = require("../markdownlint-cli2.js");
  const uncalled = (msg) => test.fail(`message logged: ${msg}`);
  const inputs = [
    "README.md",
    "./formatter-default/README.md",
    "./formatter-json/README.md",
    "./formatter-junit/README.md"
  ];
  markdownlintCli2(inputs, uncalled, uncalled).
    then((exitCode) => test.equal(exitCode, 0));
});
