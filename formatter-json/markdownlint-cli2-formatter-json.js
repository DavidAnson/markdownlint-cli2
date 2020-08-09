// @ts-check

"use strict";

const fs = require("fs").promises;

// Writes markdownlint-cli2 results to a file in JSON format
const outputFormatter = (options, params) => {
  const { results } = options;
  const { name, spaces } = (params || {});
  const content = JSON.stringify(results, null, spaces || 2);
  return fs.writeFile(name || "markdownlint-cli2-results.json", content, "utf8");
};

module.exports = outputFormatter;
