// @ts-check

import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import test from "ava";
import { __filename } from "./esm-helpers.mjs";

/** @typedef {import("../markdownlint-cli2.mjs").OutputFormatterOptions} OutputFormatterOptions */
/** @typedef {import("../markdownlint-cli2.mjs").LintResult} LintResult */

const formatterInfos = [
  [ "codequality", "markdownlint-cli2-codequality.json" ],
  [ "default" ],
  [ "json", "markdownlint-cli2-results.json" ],
  [ "junit", "markdownlint-cli2-junit.xml" ],
  [ "pretty" ],
  [ "sarif", "markdownlint-cli2-sarif.sarif" ],
  [ "summarize" ],
  [ "template" ]
];

const testDirectory = __filename(import.meta).replace(/\..+$/u, "");

test.before("make test directory", () => mkdir(testDirectory));

test.after.always("remove test directory", () => rm(testDirectory, { "recursive": true }));

for (const formatterInfo of formatterInfos) {
  const [ formatter, output ] = formatterInfo;
  test(formatter, async (t) => {
    t.plan(1);
    /** @type {string[]} */
    const messages = [];
    /** @type {string[]} */
    const errors = [];
    const logMessage = (/** @type {string} */ msg) => messages.push(msg);
    const logError = (/** @type {string} */ err) => errors.push(err);
    /** @type {LintResult} */
    const result = {
      "fileName": "file.name",
      "lineNumber": 1,
      "ruleNames": [ "rule", "name" ],
      "ruleDescription": "ruleDescription",
      "ruleInformation": "ruleInformation",
      "errorDetail": "errorDetail",
      "errorContext": "errorContext",
      "errorRange": [ 1, 2 ],
      "fixInfo": {
        "lineNumber": 2,
        "editColumn": 3,
        "deleteCount": 4,
        "insertText": "insertText"
      },
      "severity": "error"
    };
    const transform = (/** @type {(res: LintResult) => void} */ fn) => {
      const copy = { ...result };
      fn(copy);
      return copy;
    };
    const results = [
      result,
      /* eslint-disable no-return-assign */
      transform((res) => res.ruleInformation = null),
      transform((res) => res.errorDetail = null),
      transform((res) => res.errorContext = null),
      transform((res) => res.errorRange = null),
      transform((res) => res.fixInfo = null),
      transform((res) => res.severity = "warning"),
      /* eslint-enable no-return-assign */
      // @ts-ignore
      transform((res) => delete res.severity)
    ];
    /** @type {OutputFormatterOptions} */
    const options = {
      "directory": testDirectory,
      results,
      logMessage,
      logError
    };
    // eslint-disable-next-line unicorn/no-await-expression-member
    const instance = (await import(`../formatter-${formatter}/markdownlint-cli2-formatter-${formatter}.js`)).default;
    await instance(options, { "byFile": true, "byRule": true });
    t.snapshot({
      messages,
      errors,
      "output": output ? await readFile(path.join(testDirectory, output), "utf8").catch(() => "") : ""
    });
  });
}
