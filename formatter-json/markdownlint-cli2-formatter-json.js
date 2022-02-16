// @ts-check

"use strict";

const fs = require("fs").promises;
const path = require("path");

// Writes markdownlint-cli2 results to a file in JSON format
const outputFormatter = (options, params) => {
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
