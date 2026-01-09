// @ts-check

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "ava";
import { __dirname } from "./esm-helpers.mjs";

/**
 * @typedef {object} InvokeResult
 * @property {number} exitCode Exit code.
 * @property {string} stderr Standard error.
 * @property {string} stdout Standard output.
 */

/**
 * @callback InvokeFn
 * @returns {Promise<InvokeResult>}
 */

/**
 * @typedef {object} TestConfiguration
 * @property {string} host Host name.
 * @property {string} baseDir Base directory.
 * @property {(relative: string, args: string[], noImport: boolean | undefined, env: Record<string, string> | undefined, script: string | undefined) => InvokeFn} invoke Function to invoke tests.
 * @property {(fromDir: string, toDir: string) => Promise<void>} copyDir Function to copy directory.
 * @property {(dir: string) => Promise<void>} removeDir Function to remove directory.
 * @property {boolean} includeNoImport Include no-import-based tests.
 * @property {boolean} includeEnv Include environment-based tests.
 * @property {boolean} includeScript Include script-based tests.
 * @property {boolean} includeRequire Include require-based tests.
 */

/**
 * @typedef {object} TestDefinition
 * @property {string} name Test name.
 * @property {string} [shadow] Shadow test name.
 * @property {string} [script] Override script.
 * @property {string[]} args Arguments.
 * @property {number} exitCode Exit code.
 * @property {string} [cwd] Current working directory.
 * @property {Record<string, string>} [env] Environment.
 * @property {RegExp} [stderrRe] Standard error regular expression.
 * @property {boolean} [isolate] Isolate test directory.
 * @property {boolean} [noImport] No import.
 * @property {boolean} [usesRequire] Uses require.
 */

/** @typedef {[ InvokeResult, string, string, string, string, string, string, string, string ]} TestOutput */

const empty = () => "";
const sanitize = (/** @type {string} */ str) => str.
  replace(/\r/gu, "").
  replace(/\bv\d+\.\d+\.\d+\b/gu, "vX.Y.Z").
  replace(/ :.+[/\\]sentinel/gu, " :[PATH]");
const sameFileSystem = (path.relative(os.homedir(), __dirname(import.meta)) !== __dirname(import.meta));
const isModule = (/** @type {string} */ file) => file.endsWith(".cjs") || file.endsWith(".mjs");

const testCases = (/** @type {TestConfiguration} */ {
  host,
  invoke,
  baseDir,
  copyDir,
  removeDir,
  includeNoImport,
  includeEnv,
  includeScript,
  includeRequire
}) => {

  const testCase = (/** @type {TestDefinition} */ options) => {
    const {
      name,
      shadow,
      script,
      args,
      exitCode,
      cwd,
      env,
      stderrRe,
      isolate,
      noImport,
      usesRequire
    } = options;
    const usesEnv = Boolean(env);
    const usesScript = Boolean(script);
    const setup = (/** @type {string} */ fromDir, /** @type {string} */ toDir) => isolate ? copyDir(fromDir, toDir) : Promise.resolve();
    const teardown = (/** @type {string} */ dir) => isolate ? removeDir(dir) : Promise.resolve();
    const isolatedDir = `${name}-copy-${host}`;
    if (
      (noImport && !includeNoImport) ||
      (usesEnv && !includeEnv) ||
      (usesRequire && !includeRequire) ||
      (usesScript && !includeScript)
    ) {
      return;
    }
    test(`${name} (${host})`, (t) => {
      t.plan(3);
      const relative = (isolate && isolatedDir) || cwd || name;
      const directory = path.join(__dirname(import.meta), relative);
      return setup(shadow || name, isolatedDir).
        then(invoke(relative, args, noImport, env, script)).
        then((/** @type {InvokeResult} */ result) => Promise.all([
          result,
          fs.readFile(
            path.join(directory, "markdownlint-cli2-codequality.json"),
            "utf8"
          ).catch(empty),
          fs.readFile(
            path.join(directory, "custom-name-codequality.json"),
            "utf8"
          ).catch(empty),
          fs.readFile(
            path.join(directory, "markdownlint-cli2-results.json"),
            "utf8"
          ).catch(empty),
          fs.readFile(
            path.join(directory, "custom-name-results.json"),
            "utf8"
          ).catch(empty),
          fs.readFile(
            path.join(directory, "markdownlint-cli2-junit.xml"),
            "utf8"
          ).catch(empty),
          fs.readFile(
            path.join(directory, "custom-name-junit.xml"),
            "utf8"
          ).catch(empty),
          fs.readFile(
            path.join(directory, "markdownlint-cli2-sarif.sarif"),
            "utf8"
          ).catch(empty),
          fs.readFile(
            path.join(directory, "custom-name-sarif.sarif"),
            "utf8"
          ).catch(empty)
        ])).
        then((/** @type {TestOutput} */ results) => Promise.all([
          teardown(isolatedDir),
          new Promise((resolve) => {
            const [
              child,
              formatterOutputCodeQuality,
              formatterOutputCodeQualityCustom,
              formatterOutputJson,
              formatterOutputJsonCustom,
              formatterOutputJunit,
              formatterOutputJunitCustom,
              formatterOutputSarif,
              formatterOutputSarifCustom
            ] = results;
            t.is(child.exitCode, exitCode);
            const actual = {
              "exitCode": child.exitCode,
              "stdout": sanitize(child.stdout),
              "stderr": sanitize(child.stderr),
              "formatterCodeQuality": sanitize(formatterOutputCodeQuality || formatterOutputCodeQualityCustom),
              "formatterJson": sanitize(formatterOutputJson || formatterOutputJsonCustom),
              "formatterJunit": sanitize(formatterOutputJunit || formatterOutputJunitCustom),
              "formatterSarif": sanitize(formatterOutputSarif || formatterOutputSarifCustom)
            };
            if (stderrRe) {
              t.regex(child.stderr, stderrRe);
              // @ts-ignore
              delete actual.stderr;
            } else {
              t.true(true);
            }
            t.snapshot(actual);
            resolve(null);
          })
        ]));
    });
  };

  testCase({
    "name": "no-arguments",
    "args": [],
    "exitCode": 2,
    "cwd": "no-config"
  });

  testCase({
    "name": "no-arguments-config-arg",
    "args": [ "--config" ],
    "exitCode": 2,
    "cwd": "no-config"
  });

  testCase({
    "name": "missing-argument-config-arg",
    "args": [ "**", "--config" ],
    "exitCode": 2,
    "cwd": "no-config"
  });

  testCase({
    "name": "one-argument-config-arg",
    "args": [ "--config", "../config-files/cfg/.markdownlint-cli2.jsonc" ],
    "exitCode": 2,
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
    "name": "no-config-ignore-violation",
    "args": [ "*.md", "!viewme.md" ],
    "exitCode": 0,
    "cwd": "no-config"
  });

  testCase({
    "name": "no-config-ignore-other",
    "args": [ "*.md", "!dir" ],
    "exitCode": 1,
    "cwd": "no-config"
  });

  testCase({
    "name": "no-config-ignore-only-violation",
    "args": [ "!viewme.md" ],
    "exitCode": 0,
    "cwd": "no-config"
  });

  testCase({
    "name": "no-config-ignore-only-other",
    "args": [ "!dir" ],
    "exitCode": 0,
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
    "name": "dotfiles",
    "args": [ "**" ],
    "exitCode": 1
  });

  testCase({
    "name": "dotfiles-exclude",
    "args": [ "**", "!.dir", "!**/.info.md" ],
    "exitCode": 1,
    "cwd": "dotfiles"
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
    "name": "no-globs-and-args",
    "args": [ "--no-globs", "dir/about.md", "dir/**/*.markdown" ],
    "exitCode": 1,
    "cwd": "globs-and-args"
  });

  testCase({
    "name": "no-globs-and-empty-args",
    "args": [ "--no-globs" ],
    "exitCode": 2,
    "cwd": "globs-and-args"
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
    "name": "markdownlint-cjs",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-mjs",
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
    "stderrRe": /'[^']*\.markdownlint\.json'.*Unable to parse JSONC content/u
  });

  testCase({
    "name": "markdownlint-yaml-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /'[^']*\.markdownlint\.yaml'.*duplicated mapping key/u
  });

  testCase({
    "name": "markdownlint-cjs-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unable to import module '.*\.markdownlint\.cjs'/u,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-mjs-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unable to import module '.*\.markdownlint\.mjs'/u,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-json-mismatch",
    "args": [ "viewme.md" ],
    "exitCode": 0
  });

  testCase({
    "name": "markdownlint-yaml-mismatch",
    "args": [ "viewme.md" ],
    "exitCode": 0
  });

  testCase({
    "name": "markdownlint-cli2-jsonc-mismatch",
    "args": [ "viewme.md" ],
    "exitCode": 2,
    "stderrRe": /'[^']*\.markdownlint-cli2\.jsonc'.*Unable to parse JSONC content/u
  });

  testCase({
    "name": "markdownlint-cli2-yaml-mismatch",
    "args": [ "viewme.md" ],
    "exitCode": 2,
    "stderrRe": /'[^']*\.markdownlint-cli2\.yaml'.*missed comma between flow collection entries/u
  });

  testCase({
    "name": "markdownlint-json-mismatch-config",
    "args": [ "--config", "../markdownlint-json-mismatch/.markdownlint.json", "viewme.md" ],
    "exitCode": 0,
    "cwd": "no-config"
  });

  testCase({
    "name": "markdownlint-yaml-mismatch-config",
    "args": [ "--config", "../markdownlint-yaml-mismatch/.markdownlint.yaml", "viewme.md" ],
    "exitCode": 0,
    "cwd": "no-config"
  });

  testCase({
    "name": "markdownlint-cli2-jsonc-mismatch-config",
    "args": [ "--config", "../markdownlint-cli2-jsonc-mismatch/.markdownlint-cli2.jsonc", "viewme.md" ],
    "exitCode": 2,
    "stderrRe": /'[^']*\.markdownlint-cli2\.jsonc'.*Unable to parse JSONC content/u,
    "cwd": "no-config"
  });

  testCase({
    "name": "markdownlint-cli2-yaml-mismatch-config",
    "args": [ "--config", "../markdownlint-cli2-yaml-mismatch/.markdownlint-cli2.yaml", "viewme.md" ],
    "exitCode": 2,
    "stderrRe": /'[^']*\.markdownlint-cli2\.yaml'.*missed comma between flow collection entries/u,
    "cwd": "no-config"
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
    "isolate": true,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-jsonc-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /'[^']*\.markdownlint-cli2\.jsonc'.*Unable to parse JSONC content/u
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
    "isolate": true,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-yaml-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /'[^']*\.markdownlint-cli2\.yaml'.*duplicated mapping key/u
  });

  testCase({
    "name": "markdownlint-cli2-cjs",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-mjs",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-cjs-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /'[^']*\.markdownlint-cli2\.cjs'.*Unable to import module '/u,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-mjs-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /'[^']*\.markdownlint-cli2\.mjs'.*Unable to import module '/u,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cli2-extends",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "config-option-extends",
    "args": [
      "--config",
      "configs/.markdownlint-cli2.jsonc",
      "viewme.md"
    ],
    "exitCode": 0
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
    "name": "showFound",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "frontMatter",
    "args": [ "**/*.md" ],
    "exitCode": 0
  });

  testCase({
    "name": "gitignore",
    "args": [ "**/*.{md,MD}" ],
    "exitCode": 1
  });

  testCase({
    "name": "gitignore-root-only",
    "args": [ "**/*.{md,MD}" ],
    "exitCode": 1
  });

  testCase({
    "name": "literal-files",
    "args": [
      ":view(me).md",
      ":dir/view(me).md",
      ":dir(1)/viewme.md",
      ":dir(1)/(view)me.md"
    ],
    "exitCode": 1,
    "cwd": "literal-files/sentinel"
  });

  const literalFilesAbsoluteFile = path.join(
    baseDir,
    "literal-files",
    "sentinel/dir(1)/(view)me.md"
  ).
    split(path.sep).
    join(path.posix.sep);
  testCase({
    "name": "literal-files-absolute",
    "args": [
      `:${literalFilesAbsoluteFile}`,
      "sentinel/dir"
    ],
    "exitCode": 1,
    "cwd": "literal-files"
  });

  testCase({
    "name": "fix",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "isolate": true
  });

  testCase({
    "name": "fix-scenarios",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "isolate": true
  });

  testCase({
    "name": "fix-default-true-arg",
    "shadow": "fix-default-true",
    "args": [ "--fix", "**/*.md" ],
    "exitCode": 1,
    "isolate": true
  });

  testCase({
    "name": "fix-default-true-override-arg",
    "args": [ "--fix", "**/*.md" ],
    "exitCode": 1,
    "cwd": "fix-default-true-override"
  });

  const configFiles = [
    ".markdownlint-cli2.jsonc",
    ".markdownlint-cli2.yaml",
    ".markdownlint-cli2.cjs",
    ".markdownlint-cli2.mjs",
    ".markdownlint.jsonc",
    ".markdownlint.json",
    ".markdownlint.yaml",
    ".markdownlint.yml",
    ".markdownlint.cjs",
    ".markdownlint.mjs"
  ];
  for (const configFile of configFiles) {
    const usesRequire = isModule(configFile);
    testCase({
      "name": `config-files-${configFile}-arg`,
      "args": [ "--config", `cfg/${configFile}`, "**/*.md" ],
      "exitCode": 1,
      "cwd": "config-files",
      usesRequire
    });
    testCase({
      "name": `config-files-${configFile}-alternate-arg`,
      "args": [ "--config", `cfg/alternate${configFile}`, "**/*.md" ],
      "exitCode": 1,
      "cwd": "config-files",
      usesRequire
    });
    testCase({
      "name": `config-files-${configFile}-absolute-arg`,
      "args": [
        "--config",
        path.join(baseDir, "config-files", `cfg/${configFile}`),
        "**/*.md"
      ],
      "exitCode": 1,
      "cwd": "config-files",
      usesRequire
    });
  }

  const unableToParseJsonc = "Unable to parse JSONC content";
  const unableToRequireOrImport = "Unable to import module";
  const invalidConfigFiles = [
    [ "invalid.markdownlint-cli2.jsonc", unableToParseJsonc ],
    [ "invalid.markdownlint-cli2.cjs", unableToRequireOrImport ],
    [ "invalid.markdownlint-cli2.mjs", unableToRequireOrImport ],
    [ "invalid.markdownlint.json", unableToParseJsonc ],
    [ "invalid.markdownlint.yaml", unableToParseJsonc ],
    [ "invalid.markdownlint.cjs", unableToRequireOrImport ],
    [ "invalid.markdownlint.mjs", unableToRequireOrImport ]
  ];
  for (const [ invalidConfigFile, stderrRe ] of invalidConfigFiles) {
    const usesRequire = isModule(invalidConfigFile);
    testCase({
      "name": `config-files-${invalidConfigFile}-invalid-arg`,
      "args": [ "--config", `cfg/${invalidConfigFile}`, "**/*.md" ],
      "exitCode": 2,
      "stderrRe": new RegExp(`'[^']*${invalidConfigFile.replace(".", "\\.")}'.*${stderrRe}`, "u"),
      "cwd": "config-files",
      usesRequire
    });
  }

  const redundantConfigFiles = [
    ".markdownlint-cli2.jsonc",
    ".markdownlint.json",
    ".markdownlint.cjs"
  ];
  for (const redundantConfigFile of redundantConfigFiles) {
    const usesRequire = isModule(redundantConfigFile);
    testCase({
      "name": `config-files-${redundantConfigFile}-redundant-arg`,
      "args": [ "--config", redundantConfigFile, "*.md" ],
      "exitCode": 1,
      "cwd": redundantConfigFile.slice(1).replace(".", "-"),
      usesRequire
    });
  }

  testCase({
    "name": "config-file-unrecognized-arg",
    "args": [ "--config", "cfg/unrecognized.jsonc", "**/*.md" ],
    "exitCode": 2,
    "stderrRe":
      /Unable to use configuration file '[^']*cfg\/unrecognized\.jsonc'; Configuration file should be one of the supported names \(e\.g\., '\.markdownlint-cli2\.jsonc'\) or a prefix with a supported name \(e\.g\., 'example\.markdownlint-cli2\.jsonc'\)\./u,
    "cwd": "config-files"
  });

  testCase({
    "name": "config-relative-commonjs-arg",
    "args": [
      "--config",
      "config/.markdownlint-cli2.jsonc",
      "viewme.md",
      "link.md"
    ],
    "exitCode": 1,
    "cwd": "config-relative-commonjs",
    "usesRequire": true
  });

  testCase({
    "name": "config-relative-module-arg",
    "args": [
      "--config",
      "config/.markdownlint-cli2.jsonc",
      "viewme.md",
      "link.md"
    ],
    "exitCode": 1,
    "cwd": "config-relative-module",
    "usesRequire": true
  });

  testCase({
    "name": "config-with-fix-arg",
    "shadow": "config-with-fix",
    "args": [
      "--config",
      "config/.markdownlint-cli2.jsonc",
      "viewme.md",
      "info.md"
    ],
    "exitCode": 0,
    "isolate": true
  });

  testCase({
    "name": "package-json",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "package-json-fix",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "isolate": true
  });

  testCase({
    "name": "package-json-invalid",
    "args": [ "**/*.md" ],
    "exitCode": 2,
    "stderrRe": /'[^']*package\.json'.*Unable to parse JSONC content/u
  });

  testCase({
    "name": "package-json-nested",
    "args": [ "**/*.md" ],
    "exitCode": 1
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
    "stderrRe": /Unable to import module 'missing-package'\./u,
    "usesRequire": true
  });

  testCase({
    "name": "customRules-invalid",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Property 'names' of custom rule at index 0 is incorrect: 'undefined'\./u,
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
    "stderrRe": /Unable to import module 'missing-package'\./u,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "isolate": true,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-npm",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "isolate": true,
    "env": {
      "FORCE_COLOR": "1",
      "FORCE_HYPERLINK": "1"
    },
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-params",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "isolate": true,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-params-absolute",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "isolate": true,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-severity",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "isolate": true,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-pre-imported",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "isolate": true,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-clean",
    "args": [ "**/*.md" ],
    "exitCode": 0,
    "isolate": true,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-file",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-module",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "outputFormatters-missing",
    "args": [ ".*" ],
    "exitCode": 2,
    "stderrRe": /Unable to import module 'missing-package'\./u,
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
    "exitCode": 1,
    "env": {
      "FORCE_COLOR": "1",
      "FORCE_HYPERLINK": "1"
    }
  });

  testCase({
    "name": "formatter-pretty-appendLink",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "env": {
      "FORCE_COLOR": "1"
    }
  });

  testCase({
    "name": "formatter-template",
    "args": [ "*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "nested-files",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

  testCase({
    "name": "nested-directories",
    "args": [ "**", "!a", "a/b", "#a/b/c", "a/b/c/d" ],
    "exitCode": 1
  });

  testCase({
    "name": "nested-options-config",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "markdownlint-cjs-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownlint-cjs",
    "noImport": true
  });

  testCase({
    "name": "markdownlint-mjs-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownlint-mjs",
    "noImport": true
  });

  testCase({
    "name": "markdownlint-cli2-cjs-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownlint-cli2-cjs",
    "noImport": true
  });

  testCase({
    "name": "markdownlint-cli2-mjs-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownlint-cli2-mjs",
    "noImport": true
  });

  testCase({
    "name": "customRules-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "customRules",
    "noImport": true
  });

  testCase({
    "name": "markdownItPlugins-no-require",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "markdownItPlugins",
    "noImport": true
  });

  if (sameFileSystem) {

    testCase({
      "name": "tilde-paths-commonjs",
      "args": [ "*.md" ],
      "exitCode": 1,
      "usesRequire": true
    });

    testCase({
      "name": "tilde-paths-module",
      "args": [ "*.md" ],
      "exitCode": 1,
      "usesRequire": true
    });

  }

  testCase({
    "name": "no-arg",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "cwd": "no-config"
  });

  testCase({
    "name": "config-first-arg",
    "args": [
      "--config",
      "../config-files/cfg/.markdownlint-cli2.jsonc",
      "**/*.md"
    ],
    "exitCode": 1,
    "cwd": "no-config"
  });

  testCase({
    "name": "config-last-arg",
    "args": [
      "**/*.md",
      "--config",
      "../config-files/cfg/.markdownlint-cli2.jsonc"
    ],
    "exitCode": 1,
    "cwd": "no-config"
  });

  testCase({
    "name": "config-last-used-arg",
    "args": [
      "--config",
      "../config-files/cfg/invalid.markdownlint-cli2.jsonc",
      "**/*.md",
      "--config",
      "../config-files/cfg/.markdownlint-cli2.jsonc"
    ],
    "exitCode": 1,
    "cwd": "no-config"
  });

  testCase({
    "name": "fix-first-arg",
    "shadow": "no-config",
    "args": [ "--fix", "**/*.md" ],
    "exitCode": 1,
    "isolate": true
  });

  testCase({
    "name": "fix-last-arg",
    "shadow": "no-config",
    "args": [ "**/*.md", "--fix" ],
    "exitCode": 1,
    "isolate": true
  });

  testCase({
    "name": "fix-multiple-arg",
    "shadow": "no-config",
    "args": [ "--fix", "**/*.md", "--fix" ],
    "exitCode": 1,
    "isolate": true
  });

  testCase({
    "name": "fix-and-config-arg",
    "shadow": "no-config",
    "args": [
      "--fix",
      "**/*.md",
      "--config",
      "../config-with-fix/.markdownlint-cli2.jsonc"
    ],
    "exitCode": 1,
    "isolate": true
  });

  testCase({
    "name": "modulePaths",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "modulePaths-non-root",
    "args": [ "**/*.md" ],
    "exitCode": 1,
    "usesRequire": true
  });

  testCase({
    "name": "jsonc-trailing-comma",
    "args": [ "**/*.md" ],
    "exitCode": 1
  });

};

export default testCases;
