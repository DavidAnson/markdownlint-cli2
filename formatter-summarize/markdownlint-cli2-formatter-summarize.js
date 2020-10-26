// @ts-check

"use strict";

const logColumns = (log, count, name, indent) => {
  log(`${"".padEnd(indent || 0)}${count.toString().padStart(5)} ${name}`);
};

// Summarize the results
const outputFormatter = (options, params) => {
  const { logMessage, results } = options;
  const { byFile, byRule, byFileByRule, byRuleByFile } = (params || {});
  // Calculate statistics
  const countByFile = {};
  const countByRule = {};
  const countByFileByRule = {};
  const countByRuleByFile = {};
  for (const result of results) {
    const { fileName, ruleNames } = result;
    countByFile[fileName] = (countByFile[fileName] || 0) + 1;
    const ruleName = ruleNames.join("/");
    countByRule[ruleName] = (countByRule[ruleName] || 0) + 1;
    const countByRuleOfFile = countByFileByRule[fileName] || {};
    countByRuleOfFile[ruleName] = (countByRuleOfFile[ruleName] || 0) + 1;
    countByFileByRule[fileName] = countByRuleOfFile;
    const countByFileOfRule = countByRuleByFile[ruleName] || {};
    countByFileOfRule[fileName] = (countByFileOfRule[fileName] || 0) + 1;
    countByRuleByFile[ruleName] = countByFileOfRule;
  }
  // Show statistics by...
  if (byFile) {
    logColumns(logMessage, "Count", "File");
    const files = Object.keys(countByFile);
    files.sort();
    files.forEach((file) => logColumns(logMessage, countByFile[file], file));
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
    const files = Object.keys(countByFileByRule);
    files.sort();
    for (const file of files) {
      logMessage(file);
      logColumns(logMessage, "Count", "Rule", 2);
      const countByRuleOfFile = countByFileByRule[file];
      const rules = Object.keys(countByRuleOfFile);
      rules.sort();
      rules.forEach(
        (rule) => logColumns(logMessage, countByRuleOfFile[rule], rule, 2)
      );
      const total = countByFile[file];
      logColumns(logMessage, total, "[Total]", 2);
    }
  }
  if (byRuleByFile) {
    const rules = Object.keys(countByRuleByFile);
    rules.sort();
    for (const rule of rules) {
      logMessage(rule);
      logColumns(logMessage, "Count", "File", 2);
      const countByFileOfRule = countByRuleByFile[rule];
      const files = Object.keys(countByFileOfRule);
      files.sort();
      files.forEach(
        (file) => logColumns(logMessage, countByFileOfRule[file], file, 2)
      );
      const total = countByRule[rule];
      logColumns(logMessage, total, "[Total]", 2);
    }
  }
};

module.exports = outputFormatter;
