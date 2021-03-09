// @ts-check

"use strict";

const test = require("ava").default;
const { "main": markdownlintCli2 } = require("../markdownlint-cli2.js");
const noop = () => null;

test("name and version", (t) => {
  t.plan(2);
  const packageJson = require("../package.json");
  const logMessage = (msg) => {
    const match = (/^(?<name>\S+)\sv(?<version>\S+)\s/u).exec(msg);
    if (match) {
      const { name, version } = match.groups;
      t.is(name, packageJson.name);
      t.is(version, packageJson.version);
    }
  };
  const logError = (msg) => t.fail(`message logged: ${msg}`);
  return markdownlintCli2({
    "argv": [],
    logMessage,
    logError
  });
});

test("README files", (t) => {
  t.plan(1);
  const uncalled = (msg) => t.fail(`message logged: ${msg}`);
  const argv = [
    "README.md",
    "./doc/OutputFormatters.md",
    "./formatter-default/README.md",
    "./formatter-json/README.md",
    "./formatter-junit/README.md",
    "./formatter-pretty/README.md",
    "./formatter-summarize/README.md"
  ];
  return markdownlintCli2({
    argv,
    "logMessage": noop,
    "logError": uncalled
  }).
    then((exitCode) => t.is(exitCode, 0));
});

test("main options default", (t) => {
  t.plan(2);
  return Promise.all([
    markdownlintCli2({
      "directory": "test/main-options-default",
      "argv": [ "*.md" ],
      "logMessage": noop,
      "logError": noop,
      "optionsDefault": {
        "config": {
          "single-trailing-newline": false
        },
        "ignores": [ "viewme.md" ]
      }
    }),
    markdownlintCli2({
      "directory": "test/main-options-default",
      "argv": [ "info.md" ],
      "logMessage": noop,
      "logError": noop,
      "optionsDefault": {
        "customRules": [ require("./customRules/rules/first-line") ]
      }
    })
  ]).
    then((exitCodes) => {
      const [ exitCode0, exitCode1 ] = exitCodes;
      t.is(exitCode0, 0);
      t.is(exitCode1, 1);
    });
});

test("main options override", (t) => {
  t.plan(2);
  const uncalled = (msg) => t.fail(`message logged: ${msg}`);
  const outputFormatter = (options) => {
    const { results } = options;
    t.is(Object.keys(results).length, 2);
  };
  return markdownlintCli2({
    "directory": "test/main-options-override",
    "argv": [ "*.md" ],
    "logMessage": noop,
    "logError": uncalled,
    "optionsOverride": {
      "config": {
        "no-trailing-spaces": false
      },
      "fix": false,
      "outputFormatters": [ [ outputFormatter ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});
