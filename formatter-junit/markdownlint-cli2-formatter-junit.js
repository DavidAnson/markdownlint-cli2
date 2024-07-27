// @ts-check

"use strict";

const fs = require("node:fs").promises;
const path = require("node:path");
const junitReportBuilder = require("junit-report-builder").default;

// Writes markdownlint-cli2 results to a file in JUnit XML format
const outputFormatter = (options, params) => {
  const { directory, results } = options;
  const { name } = (params || {});
  // Get a new builder instance because the default builder is shared
  const builder = junitReportBuilder.newBuilder();
  const outputFormatterName = path.basename(__filename).replace(/\.js$/u, "");
  const suite =
    builder.
      testSuite().
      name(outputFormatterName).
      time(0);
  for (const errorInfo of results) {
    const { fileName, lineNumber, ruleNames, ruleDescription, errorDetail,
      errorContext, errorRange } = errorInfo;
    const ruleName = ruleNames.join("/");
    const column = (errorRange && errorRange[0]) || 0;
    const columnText = column ? `, Column ${column}` : "";
    const errorDetailText = errorDetail ? `, ${errorDetail}` : "";
    const errorContextText = errorContext ? `, Context: "${errorContext}"` : "";
    const text =
      `Line ${lineNumber}${columnText}${errorDetailText}${errorContextText}`;
    suite.
      testCase().
      className(fileName).
      name(ruleName).
      failure(ruleDescription).
      stacktrace(text).
      time(0);
  }
  if (results.length === 0) {
    suite.
      testCase().
      name(outputFormatterName).
      time(0);
  }
  const content = builder.build();
  return fs.writeFile(
    path.resolve(
      // eslint-disable-next-line no-inline-comments
      directory /* c8 ignore next */ || "",
      name || "markdownlint-cli2-junit.xml"
    ),
    content,
    "utf8"
  );
};

module.exports = outputFormatter;
