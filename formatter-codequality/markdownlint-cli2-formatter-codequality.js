// @ts-check

"use strict";

const fs = require("node:fs").promises;
const path = require("node:path");
const { createHash } = require("node:crypto");

/**
 * @param {string} violation The complete textual description of the violation.
 * @returns {string} The SHA256 fingerprint for the violation as a hex string.
 */
const createFingerprint = function createFingerprint (violation) {
  const sha256 = createHash("sha256");
  sha256.update(violation);
  return sha256.digest("hex");
};

// Writes markdownlint-cli2 results to a GitLab Code Quality report JSON file.
// eslint-disable-next-line max-len
// See: https://docs.gitlab.com/ee/ci/testing/code_quality.html#implementing-a-custom-tool
const outputFormatter = (options) => {
  const { directory, results } = options;
  const issues = [];

  for (const errorInfo of results) {
    const { fileName, lineNumber, ruleNames, ruleDescription, errorDetail,
      errorContext, errorRange } = errorInfo;

    const ruleName = ruleNames.join("/");
    const errorDetailText = errorDetail ? ` [${errorDetail}]` : "";
    const text = `${ruleName}: ${ruleDescription}${errorDetailText}`;
    const column = (errorRange && errorRange[0]) || 0;
    const columnText = column ? `:${column}` : "";
    const description = ruleDescription +
          (errorDetail ? ` [${errorDetail}]` : "") +
          (errorContext ? ` [Context: "${errorContext}"]` : "");
    // Construct error text with all details to use for unique fingerprint.
    // Avoids duplicate fingerprints for the same violation on multiple lines.
    const errorText =
      `${fileName}:${lineNumber}${columnText} ${ruleName} ${description}`;

    const issue = {
      "type": "issue",
      "check_name": ruleName,
      "description": text,
      "severity": "minor",
      "fingerprint": createFingerprint(errorText),
      "location": {
        "path": fileName,
        "lines": {
          "begin": lineNumber
        }
      }
    };

    issues.push(issue);
  }

  const content = JSON.stringify(issues);
  return fs.writeFile(
    path.resolve(
      // eslint-disable-next-line no-inline-comments
      directory /* c8 ignore next */ || "",
      "markdownlint-cli2-codequality.json"
    ),
    content,
    "utf8"
  );
};

module.exports = outputFormatter;
