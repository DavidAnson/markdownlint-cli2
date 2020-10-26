// @ts-check

"use strict";

const fs = require("fs").promises;
const builder = require("junit-report-builder");

// Writes markdownlint-cli2 results to a file in JUnit XML format
const outputFormatter = (options, params) => {
  const { results } = options;
  const { name } = (params || {});
  const suite =
    builder.
      testSuite().
      name(process.argv.slice(2).join(" ")).
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
      time(0);
  }
  const content = builder.build();
  return fs.writeFile(name || "markdownlint-cli2-junit.xml", content, "utf8");
};

module.exports = outputFormatter;
