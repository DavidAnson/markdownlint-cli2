// @ts-check

"use strict";

const path = require("path");
const test = require("ava").default;
const { "main": markdownlintCli2 } = require("../markdownlint-cli2.js");

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
    "logError": uncalled
  }).
    then((exitCode) => t.is(exitCode, 0));
});

test("main options default", (t) => {
  t.plan(2);
  const uncalled = (msg) => t.fail(`message logged: ${msg}`);
  return Promise.all([
    markdownlintCli2({
      "directory": "test/main-options-default",
      "argv": [ "*.md" ],
      "logError": uncalled,
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

test("alternate file contents", (t) => {
  t.plan(2);
  const outputFormatter = (options) => {
    const { results } = options;
    t.is(Object.keys(results).length, 6);
  };
  const argv = [
    "README.md",
    "./doc/OutputFormatters.md",
    "./formatter-default/README.md",
    "./formatter-json/README.md",
    "./formatter-junit/README.md",
    "./formatter-pretty/README.md",
    "./formatter-summarize/README.md",
    "./test/all-ok/viewme.md",
    "./test/no-config/viewme.md",
    "./test/markdownlint-json/viewme.md",
    "./test/markdownlint-yaml/viewme.md"
  ];
  const fileContents = {
    "README.md": "# Heading",
    "./doc/OutputFormatters.md": "# Heading\n\n\tText.\n\n",
    "./test/all-ok/viewme.md": "# Heading",
    "./test/no-config/viewme.md": "# Heading\n",
    "./test/markdownlint-json/viewme.md": "# Heading",
    "./test/markdownlint-yaml/viewme.md": "# Heading\n"
  };
  const nonFileContents = {
    "untitled-1": "# Heading",
    "untitled-2": "# Heading\n",
    "untitled-3": ""
  };
  return markdownlintCli2({
    argv,
    fileContents,
    nonFileContents,
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatter ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("alternate file contents with ignores", (t) => {
  t.plan(2);
  const outputFormatter = (options) => {
    const { results } = options;
    t.is(Object.keys(results).length, 4);
  };
  const argv = [
    "./test/markdownlint-cli2-jsonc-example/viewme.md",
    "./test/markdownlint-cli2-yaml-example/viewme.md"
  ];
  const fileContents = {
    "./test/markdownlint-cli2-jsonc-example/viewme.md": "# Heading"
  };
  return markdownlintCli2({
    argv,
    fileContents,
    "optionsOverride": {
      "fix": false,
      "outputFormatters": [ [ outputFormatter ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, no changes", (t) => {
  t.plan(2);
  const outputFormatter = (options) => {
    const { results } = options;
    t.is(Object.keys(results).length, 4);
  };
  const directory = __dirname;
  const argv = [ "./markdownlint-json/viewme.md" ];
  return markdownlintCli2({
    directory,
    argv,
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatter ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, changes", (t) => {
  t.plan(2);
  const outputFormatter = (options) => {
    const { results } = options;
    t.is(Object.keys(results).length, 1);
  };
  const directory = __dirname;
  const argv = [ "./markdownlint-json/viewme.md" ];
  const fileContents = {
    "./markdownlint-json/viewme.md": "# Title\n\n> Tagline \n\n\n"
  };
  return markdownlintCli2({
    directory,
    argv,
    fileContents,
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatter ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, untitled", (t) => {
  t.plan(2);
  const outputFormatter = (options) => {
    const { results } = options;
    t.is(Object.keys(results).length, 2);
  };
  const directory = __dirname;
  const argv = [];
  const nonFileContents = {
    "untitled-1": "# Title\n\nText\t\n"
  };
  return markdownlintCli2({
    directory,
    argv,
    nonFileContents,
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatter ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, empty", (t) => {
  t.plan(2);
  const outputFormatter = (options) => {
    const { results } = options;
    t.is(Object.keys(results).length, 0);
  };
  const directory = __dirname;
  const argv = [];
  const nonFileContents = {
    "untitled-1": ""
  };
  return markdownlintCli2({
    directory,
    argv,
    nonFileContents,
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatter ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 0));
});

test("backslash translation", (t) => {
  t.plan(2);
  const outputFormatter = (options) => {
    const { results } = options;
    t.is(Object.keys(results).length, 24);
  };
  return markdownlintCli2({
    "directory": __dirname,
    "argv": [
      "./markdownlint-json/viewme.md",
      "markdownlint-jsonc/viewme.md",
      path.join(__dirname, "markdownlint-cli2-jsonc/viewme.md"),
      ".\\markdownlint-yml\\viewme.md",
      "markdownlint-yaml\\viewme.md",
      path.join(__dirname, "markdownlint-cli2-yaml\\viewme.md")
    ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatter ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});
