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
  const countByFile = new Map();
  const countByRule = new Map();
  const countByFileByRule = new Map();
  const countByRuleByFile = new Map();
  for (const result of results) {
    const { fileName, ruleNames } = result;
    countByFile.set(fileName, (countByFile.get(fileName) || 0) + 1);
    const ruleName = ruleNames.join("/");
    countByRule.set(ruleName, (countByRule.get(ruleName) || 0) + 1);
    const countByRuleOfFile = countByFileByRule.get(fileName) || new Map();
    countByRuleOfFile.set(ruleName, (countByRuleOfFile.get(ruleName) || 0) + 1);
    countByFileByRule.set(fileName, countByRuleOfFile);
    const countByFileOfRule = countByRuleByFile.get(ruleName) || new Map();
    countByFileOfRule.set(fileName, (countByFileOfRule.get(fileName) || 0) + 1);
    countByRuleByFile.set(ruleName, countByFileOfRule);
  }
  // Show statistics by...
  if (byFile) {
    logColumns(logMessage, "Count", "File");
    const files = [ ...countByFile.keys() ];
    files.sort();
    for (const file of files) {
      logColumns(logMessage, countByFile.get(file), file);
    }
    const total = results.length;
    logColumns(logMessage, total, "[Total]");
  }
  if (byRule) {
    logColumns(logMessage, "Count", "Rule");
    const rules = [ ...countByRule.keys() ];
    rules.sort();
    for (const rule of rules) {
      logColumns(logMessage, countByRule.get(rule), rule);
    }
    const total = results.length;
    logColumns(logMessage, total, "[Total]");
  }
  if (byFileByRule) {
    const files = [ ...countByFileByRule.keys() ];
    files.sort();
    for (const file of files) {
      logMessage(file);
      logColumns(logMessage, "Count", "Rule", 2);
      const countByRuleOfFile = countByFileByRule.get(file);
      const rules = [ ...countByRuleOfFile.keys() ];
      rules.sort();
      for (const rule of rules) {
        logColumns(logMessage, countByRuleOfFile.get(rule), rule, 2);
      }
      const total = countByFile.get(file);
      logColumns(logMessage, total, "[Total]", 2);
    }
  }
  if (byRuleByFile) {
    const rules = [ ...countByRuleByFile.keys() ];
    rules.sort();
    for (const rule of rules) {
      logMessage(rule);
      logColumns(logMessage, "Count", "File", 2);
      const countByFileOfRule = countByRuleByFile.get(rule);
      const files = [ ...countByFileOfRule.keys() ];
      files.sort();
      for (const file of files) {
        logColumns(logMessage, countByFileOfRule.get(file), file, 2);
      }
      const total = countByRule.get(rule);
      logColumns(logMessage, total, "[Total]", 2);
    }
  }
};

module.exports = outputFormatter;
