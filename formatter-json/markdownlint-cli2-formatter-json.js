// @ts-check

"use strict";

const fs = require("node:fs").promises;
const path = require("node:path");

/** @typedef {import("../markdownlint-cli2.mjs").OutputFormatterOptions} OutputFormatterOptions */

/**
 * @typedef {object} Parameters
 * @property {string} name Output file name.
 * @property {number} spaces Number of spaces to indent.
 */

// Writes markdownlint-cli2 results to a file in JSON format
const outputFormatter = (/** @type {OutputFormatterOptions} */ options, /** @type {Parameters} */ params) => {
  const { directory, results } = options;
  const { name, spaces } = (params || {});
  const content = JSON.stringify(results, null, spaces || 2);
  return fs.writeFile(
    path.resolve(
      // eslint-disable-next-line no-inline-comments
      directory /* c8 ignore next */ || "",
      name || "markdownlint-cli2-results.json"
    ),
    content,
    "utf8"
  );
};

module.exports = outputFormatter;
