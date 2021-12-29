// @ts-check

"use strict";

const fs = require("fs").promises;
const path = require("path");
const test = require("ava").default;
const cpy = require("cpy");
const del = require("del");

const crRe = /\r/gu;
const verRe = /\bv\d+\.\d+\.\d+\b/gu;
const noop = () => null;
const empty = () => "";

const testCases =
(host, invoke, includeNoRequire, includeEnv, includeScript, includeRequire) => {

  const testCase = (options) => {
    const { name, script, args, exitCode, cwd, env, stderrRe, pre, post,
      noRequire, usesEnv, usesRequire, usesScript } = options;
    if (
      (noRequire && !includeNoRequire) ||
      (usesEnv && !includeEnv) ||
      (usesRequire && !includeRequire) ||
      (usesScript && !includeScript)
    ) {
      return;
    }
    test(`${name} (${host})`, (t) => {
      t.plan(5);
      const directory = path.join(__dirname, cwd || name);
      return Promise.all([
        ((pre || noop)(name) || Promise.resolve()).
          then(invoke(directory, args, noRequire, env, script)),
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
          path.join(directory, "markdownlint-cli2-results.json"),
          "utf8"
        ).catch(empty),
        fs.readFile(
          path.join(directory, "custom-name.json"),
          "utf8"
        ).catch(empty),
        fs.readFile(
          path.join(directory, "markdownlint-cli2-junit.xml"),
          "utf8"
        ).catch(empty),
        fs.readFile(
          path.join(directory, "custom-name.xml"),
          "utf8"
        ).catch(empty)
      ]).then((output) => [ ...results, ...output ])).
        then((results) => Promise.all([
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
            t.is(child.exitCode, exitCode);
            t.is(
              child.stdout.replace(verRe, "vX.Y.Z"),
              stdout.replace(crRe, ""));
            if (stderrRe) {
              t.regex(child.stderr, stderrRe);
            } else {
              t.is(
                child.stderr.replace(verRe, "vX.Y.Z"),
                stderr.replace(crRe, ""));
            }
            t.is(
              (formatterOutputJson || formatterOutputJsonCustom).
                replace(crRe, "").replace(verRe, "vX.Y.Z"),
              formatterJson.replace(crRe, ""));
            t.is(
              (formatterOutputJunit || formatterOutputJunitCustom).
                replace(crRe, ""),
              formatterJunit.replace(crRe, ""));
            resolve();
          })
        ])).
        // The following line avoids needing @ts-ignore for the entire method
        then(noop);
    });
  };

  const directoryName = (dir) => `${dir}-copy-${host}`;

  const copyDirectory = (dir) => {
    const target = path.join("..", directoryName(dir));
    return cpy([ "**/*", "**/.*" ], target, {
      "cwd": path.join(__dirname, dir),
      "parents": true
    });
  };

  const deleteDirectory = (dir) => {
    const target = directoryName(dir);
    return del(path.join(__dirname, target));
  };

  testCase({
    "name": "no-arguments",
    "args": [],
    "exitCode": 1,
    "cwd": "no-config"
  });

  testCase({
    "name": "no-files",
    "args": [ "nothing-matches" ],
    "exitCode": 0,
    "cwd": "no-config"
  });

  testCase({
    "name": "no-files-exclamation",
    "args": [ "!" ],
    "exitCode": 0,
    "cwd": "no-config"
  });

  testCase({
    "name": "no-files-octothorpe",
    "args": [ "#" ],
    "exitCode": 0,
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
    "name": "globs",
    "args": [],
    "exitCode": 1
  });

  testCase({
    "name": "globs-and-args",
    "args": [ "**/*.markdown" ],
    "exitCode": 1
  });

  testCase({
    "name": "globs-and-ignores",
    "args": [],
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
    "name": "markdownlint-js",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
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
    "name": "markdownlint-js-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unexpected end of input/u,
    "usesRequire": true
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
    "cwd": directoryName("markdownlint-cli2-jsonc-example"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-jsonc-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unexpected end of JSON input/u
  });

  testCase({
    "name": "markdownlint-cli2-yaml",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "markdownlint-cli2-yaml-example",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("markdownlint-cli2-yaml-example"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-yaml-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Map keys must be unique/u
  });

  testCase({
    "name": "markdownlint-cli2-js",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-js-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unexpected end of input/u,
    "usesRequire": true
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
    "cwd": directoryName("fix"),
    "pre": copyDirectory,
    "post": deleteDirectory
  });

  testCase({
    "name": "fix-scenarios",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("fix-scenarios"),
    "pre": copyDirectory,
    "post": deleteDirectory
  });

  testCase({
    "name": "fix-default-true",
    "script": "markdownlint-cli2-fix.js",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("fix-default-true"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesScript": true
  });

  testCase({
    "name": "fix-default-true-override",
    "script": "markdownlint-cli2-fix.js",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesScript": true
  });

  testCase({
    "name": "customRules",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "customRules-pre-imported",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "customRules-missing",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Cannot find module 'missing-package'/u,
    "usesRequire": true
  });

  testCase({
    "name": "customRules-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Property 'names' of custom rule at index 0 is incorrect\./u,
    "usesRequire": true
  });

  testCase({
    "name": "customRules-throws",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownItPlugins",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownItPlugins-missing",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Cannot find module 'missing-package'/u,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("outputFormatters"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-npm",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("outputFormatters-npm"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-params",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("outputFormatters-params"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-pre-imported",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": directoryName("outputFormatters-pre-imported"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-clean",
    "args": [ "**/*.md" ],
    "exitCode": 0,
    "cwd": directoryName("outputFormatters-clean"),
    "pre": copyDirectory,
    "post": deleteDirectory,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-missing",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Cannot find module 'missing-package'/u,
    "usesRequire": true
  });

  testCase({
    "name": "formatter-summarize",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "formatter-pretty",
    "args": [ "**/*.md" ],
    "env": {
      "FORCE_COLOR": 1,
      "FORCE_HYPERLINK": 1
    },
    "exitCode": 1,
    "usesEnv": true
  });

  testCase({
    "name": "formatter-pretty-appendLink",
    "args": [ "**/*.md" ],
    "env": {
      "FORCE_COLOR": 1
    },
    "exitCode": 1,
    "usesEnv": true
  });

  testCase({
    "name": "nested-files",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "nested-directories",
    "args": [ "**", "!a", "a/b", "#a/b/c", "a/b/c/d" ],
    "exitCode": 1,
    "cwd": "nested-directories"
  });

  testCase({
    "name": "nested-options-config",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-js-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownlint-js",
    "noRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-js-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownlint-cli2-js",
    "noRequire": true
  });

  testCase({
    "name": "customRules-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "customRules",
    "noRequire": true
  });

  testCase({
    "name": "markdownItPlugins-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownItPlugins",
    "noRequire": true
  });

};

module.exports = testCases;
