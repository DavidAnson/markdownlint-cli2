// @ts-check

"use strict";

const fs = require("node:fs").promises;
const path = require("node:path");
const packageJson = require("./package.json");

/** @typedef {import("../markdownlint-cli2.mjs").OutputFormatterOptions} OutputFormatterOptions */

/**
 * @typedef {object} Parameters
 * @property {string} name Output file name.
 */

// https://docs.oasis-open.org/sarif/sarif/v2.0/csprd01/sarif-v2.0-csprd01.html

/**
 * @typedef {object} SarifRegion
 * @property {number} [endColumn] End column.
 * @property {number} endLine End line.
 * @property {number} [startColumn] Start column.
 * @property {number} startLine Start line.
 */

/** @typedef {{ text: string }} SarifMessage */

/** @typedef {{ uri: string }} SarifArtifactLocation */

/** @typedef {{ artifactLocation: SarifArtifactLocation, region: SarifRegion }} SarifPhysicalLocation */

/** @typedef {{ physicalLocation: SarifPhysicalLocation }} SarifLocation */

/**
 * @typedef {object} SarifRule
 * @property {string} id ID.
 * @property {string} name Name.
 * @property {SarifMessage} shortDescription Short description.
 * @property {SarifMessage} fullDescription Full description.
 * @property {string} [helpUri] Help URI.
 */

/**
 * @typedef {object} SarifResult
 * @property {string} ruleId Rule ID.
 * @property {SarifMessage} message Message.
 * @property {"error" | "warning"} [level] Level.
 * @property {SarifLocation[]} locations Locations.
 */

const toLower = (/** @type {string} */ s) => s.toLowerCase();
const toUpper = (/** @type {string} */ s) => s.toUpperCase();

// Writes markdownlint-cli2 results to a file in Static Analysis Results
// Interchange Format/SARIF
const outputFormatter = (/** @type {OutputFormatterOptions} */ options, /** @type {Parameters} */ params) => {
  const { directory, results } = options;
  const { name } = (params || {});

  // Create SARIF object
  /** @type {SarifRule[]} */
  const sarifRules = [];
  /** @type {SarifResult[]} */
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
    const { fileName, lineNumber, ruleNames, ruleDescription, ruleInformation, errorDetail, errorContext, errorRange, severity } = errorInfo;
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
      /** @type {SarifRule} */
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
    /** @type {SarifRegion} */
    const sarifRegion = {
      "startLine": lineNumber,
      "endLine": lineNumber
    };
    if (errorRange) {
      const [ column, length ] = errorRange;
      sarifRegion.startColumn = column;
      sarifRegion.endColumn = column + length;
    }
    /** @type {SarifResult} */
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
    if (severity) {
      sarifResult.level = severity;
    }
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
