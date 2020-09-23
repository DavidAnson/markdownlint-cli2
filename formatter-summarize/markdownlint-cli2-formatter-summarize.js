// @ts-check

"use strict";

const logColumns = (log, count, name, indent) => {
  log(`${"".padEnd(indent || 0)}${count.toString().padStart(5)} ${name}`)
}

// Summarize the results
const outputFormatter = (options, params) => {
  const { logMessage, results } = options;
  const { byFile, byRule, byFileByRule } = (params || {});
  // Calculate statistics
  const countByFile = {};
  const countByRule = {};
  const countByFileByRule = {};
  for (const result of results) {
    countByFile[result.fileName] = (countByFile[result.fileName] || 0) + 1;
    const ruleName = result.ruleNames.join("/");
    countByRule[ruleName] = (countByRule[ruleName] || 0) + 1;
    const byRule = countByFileByRule[result.fileName] || {};
    byRule[ruleName] = (byRule[ruleName] || 0) + 1;
    countByFileByRule[result.fileName] = byRule;
  }
  // Show statistics by...
  if (byFile) {
    logColumns(logMessage, "Count", "File");
    const fileNames = Object.keys(countByFile);
    fileNames.sort();
    fileNames.forEach((fileName) => logColumns(logMessage, countByFile[fileName], fileName));
    const total = results.length;
    logColumns(logMessage, total, "[Total]");
  }
  if (byRule) {
    logColumns(logMessage, "Count", "Rule");
    const rules = Object.keys(countByRule);
    rules.sort();
    rules.forEach((rule) => logColumns(logMessage, countByRule[rule], rule));
    const total = results.length;
    logColumns(logMessage, total, "[Total]");
  }
  if (byFileByRule) {
    const fileNames = Object.keys(countByFileByRule);
    fileNames.sort();
    for (const fileName of fileNames) {
      logMessage(fileName)
      logColumns(logMessage, "Count", "Rule", 2);
      const byRule = countByFileByRule[fileName];
      const rules = Object.keys(byRule);
      rules.sort();
      rules.forEach((rule) => logColumns(logMessage, byRule[rule], rule, 2));
      const total = countByFile[fileName];
      logColumns(logMessage, total, "[Total]", 2);
    }
  }
};

module.exports = outputFormatter;
