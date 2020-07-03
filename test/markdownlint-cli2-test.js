// @ts-check

"use strict";

const fs = require("fs");
const path = require("path");
const execa = require("execa");
const tape = require("tape");
require("tape-player");

function testCase(name, args, exitCode) {
  tape(name, (test) => {
    test.plan(3);
    Promise.all([
      execa.node(
        "markdownlint-cli2.js",
        args,
        {
          "reject": false,
          "stripFinalNewline": false
        }
      ),
      fs.promises.readFile(
        path.join(".", "test", `${name}.stdout`),
        "utf8"
      ),
      fs.promises.readFile(
        path.join(".", "test", `${name}.stderr`),
        "utf8"
      )
    ])
    .then((results) => {
      const [ child, stdout, stderr ] = results;
      test.equal(child.exitCode, exitCode);
      test.equal(child.stdout, stdout);
      test.equal(child.stderr, stderr);
    });
  });
}

testCase(
  "no-arguments",
  [],
  1
);
