// @ts-check

"use strict";

const fs = require("node:fs").promises;
const path = require("node:path");
const { createHash } = require("node:crypto");

/** @typedef {import("../markdownlint-cli2.mjs").OutputFormatterOptions} OutputFormatterOptions */

/**
 * @typedef {object} Parameters
 * @property {string} name Output file name.
 * @property { "info" | "minor" | "major" | "critical" | "blocker" } severity Default issue severity.
 * @property { "info" | "minor" | "major" | "critical" | "blocker" } severityError Issue severity for errors.
 * @property { "info" | "minor" | "major" | "critical" | "blocker" } severityWarning Issue severity for warnings.
 */

/**
 * @param {string} violation The complete textual description of the violation.
 * @returns {string} The SHA256 fingerprint for the violation as a hex string.
 */
const createFingerprint = function createFingerprint(violation) {
  const sha256 = createHash("sha256");
  sha256.update(violation);
  return sha256.digest("hex");
};

// Writes markdownlint-cli2 results to a GitLab Code Quality report JSON file.
// See: https://docs.gitlab.com/ci/testing/code_quality/#code-quality-report-format
const outputFormatter = (/** @type {OutputFormatterOptions} */ options, /** @type {Parameters} */ params) => {
  const { directory, results } = options;
  const { name, severity, severityError, severityWarning } = (params || {});
  const issues = [];

  for (const errorInfo of results) {
    const { fileName, lineNumber, ruleNames, ruleDescription, errorDetail, errorContext, errorRange } = errorInfo;

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
    const errorText = `${fileName}:${lineNumber}${columnText} ${ruleName} ${description}`;
    const errorSeverity = ((errorInfo.severity === "warning") ? severityWarning : severityError) || severity || "minor";

    const issue = {
      "type": "issue",
      "check_name": ruleName,
      "description": text,
      "severity": errorSeverity,
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

  const content = JSON.stringify(issues, null, 2);
  return fs.writeFile(
    path.resolve(
      // eslint-disable-next-line no-inline-comments
      directory /* c8 ignore next */ || "",
      name || "markdownlint-cli2-codequality.json"
    ),
    content,
    "utf8"
  );
};

module.exports = outputFormatter;
