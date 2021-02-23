// @ts-check

"use strict";

const test = require("ava").default;
const noop = () => null;

test("name and version", (t) => {
  t.plan(2);
  const { "main": markdownlintCli2 } = require("../markdownlint-cli2.js");
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

test("READMEs", (t) => {
  t.plan(1);
  const { "main": markdownlintCli2 } = require("../markdownlint-cli2.js");
  const logError = (msg) => t.fail(`message logged: ${msg}`);
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
    logError
  }).
    then((exitCode) => t.is(exitCode, 0));
});
