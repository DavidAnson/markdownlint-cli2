// @ts-check

"use strict";

const fs = require("node:fs").promises;
const path = require("node:path");
const packageJson = require("./package.json");

const toLower = (s) => s.toLowerCase();
const toUpper = (s) => s.toUpperCase();

// Writes markdownlint-cli2 results to a file in Static Analysis Results
// Interchange Format/SARIF
const outputFormatter = (options, params) => {
  const { directory, results } = options;
  const { name } = (params || {});

  // Create SARIF object
  const sarifRules = [];
  const sarifResults = [];
  const sarif = {
    "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
    "version": "2.1.0",
    "runs": [
      {
        "tool": {
          "driver": {
            "name": Object.keys(packageJson.peerDependencies)[0],
            "version": packageJson.version,
            "informationUri": packageJson.homepage,
            "rules": sarifRules
          }
        },
        "results": sarifResults
      }
    ]
  };

  // Fill in errors
  const rulesSeen = new Set();
  for (const errorInfo of results) {

    // Capture error info
    const { fileName, lineNumber, ruleNames, ruleDescription, ruleInformation,
      errorDetail, errorContext, errorRange } = errorInfo;
    const [ ruleId ] = ruleNames;
    // Format rule name per SARIF validator rule SARIF2012
    const ruleName = ruleNames.
      join(" ").
      replace(/\w/gu, toLower).
      replace(/\b\w/gu, toUpper).
      replace(/[^\dA-Za-z]/gu, "");
    const errorDetailText = errorDetail ? `, ${errorDetail}` : "";
    const errorContextText = errorContext ? `, Context: "${errorContext}"` : "";

    // Fill in rule info the first time it's seen
    if (!rulesSeen.has(ruleId)) {
      rulesSeen.add(ruleId);
      const sarifRule = {
        "id": ruleId,
        "name": ruleName,
        "shortDescription": {
          "text": ruleDescription
        },
        "fullDescription": {
          "text": ruleDescription
        }
      };
      if (ruleInformation) {
        sarifRule.helpUri = ruleInformation;
      }
      sarifRules.push(sarifRule);
    }

    // Fill in error info
    const sarifRegion = {
      "startLine": lineNumber,
      "endLine": lineNumber
    };
    if (errorRange) {
      const [ column, length ] = errorRange;
      sarifRegion.startColumn = column;
      sarifRegion.endColumn = column + length;
    }
    const sarifResult = {
      ruleId,
      "message": {
        "text": `${ruleDescription}${errorDetailText}${errorContextText}`
      },
      "locations": [
        {
          "physicalLocation": {
            "artifactLocation": {
              "uri": fileName
            },
            "region": sarifRegion
          }
        }
      ]
    };
    sarifResults.push(sarifResult);
  }

  // Write SARIF object
  const content = JSON.stringify(sarif, null, 2);
  return fs.writeFile(
    path.resolve(
      // eslint-disable-next-line no-inline-comments
      directory /* c8 ignore next */ || "",
      name || "markdownlint-cli2-sarif.sarif"
    ),
    content,
    "utf8"
  );
};

module.exports = outputFormatter;
