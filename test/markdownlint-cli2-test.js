// @ts-check

"use strict";

const fs = require("fs");
const path = require("path");
const execa = require("execa");
const tape = require("tape");
require("tape-player");

const crRe = /\r/gu;
const verRe = /\b\d+\.\d+\.\d+\b/u;

const testCase = (options) => {
  const { name, args, exitCode, cwd, stderrRe } = options;
  tape(name, (test) => {
    test.plan(3);
    Promise.all([
      execa.node(
        path.join(__dirname, "..", "markdownlint-cli2.js"),
        args,
        {
          "cwd": path.join(__dirname, `${cwd || name}`),
          "reject": false,
          "stripFinalNewline": false
        }
      ),
      fs.promises.readFile(
        path.join(__dirname, `${name}.stdout`),
        "utf8"
      ).catch(() => ""),
      fs.promises.readFile(
        path.join(__dirname, `${name}.stderr`),
        "utf8"
      ).catch(() => "")
    ]).then((results) => {
      const [ child, stdout, stderr ] = results;
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
    });
  });
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
  "name": "markdownlintignore",
  "args": [ "**/*.md" ],
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

tape("README.md", (test) => {
  test.plan(1);
  const markdownlintCli2 = require("../markdownlint-cli2.js");
  const uncalled = (msg) => test.fail(`message logged: ${msg}`);
  markdownlintCli2([ "README.md" ], uncalled, uncalled).
    then((exitCode) => test.equal(exitCode, 0));
});
