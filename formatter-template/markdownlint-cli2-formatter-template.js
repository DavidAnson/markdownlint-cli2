// @ts-check

"use strict";

// eslint-disable-next-line prefer-named-capture-group
const tokenRe = /\$\{(fileName|lineNumber|columnNumber|ruleName|ruleDescription|ruleInformation|errorContext|errorDetail)(?:([:!])([^{}]*\{[^{}]+\}[^{}]*|[^}]+))?\}/igu;

// Output markdownlint-cli2 results using a template
const outputFormatter = (options, params) => {
  const { logError, results } = options;
  const template = params?.template ||
    // eslint-disable-next-line no-template-curly-in-string
    "fileName=\"${fileName}\" lineNumber=${lineNumber} ${columnNumber:columnNumber=${columnNumber} }ruleName=${ruleName} ruleDescription=\"${ruleDescription}\" ruleInformation=${ruleInformation} errorContext=\"${errorContext}\" errorDetail=\"${errorDetail}\"";

  for (const result of results) {
    const tokenToResult = {
      "fileName": result.fileName,
      "lineNumber": result.lineNumber,
      "columnNumber": result.errorRange?.[0],
      "ruleName": result.ruleNames.join("/"),
      "ruleDescription": result.ruleDescription,
      "ruleInformation": result.ruleInformation,
      "errorContext": result.errorContext,
      "errorDetail": result.errorDetail
    };

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const replacer = (match, token, type, text) => {
      const value = tokenToResult[token];
      switch (type) {
        case ":":
        {
          return (value === undefined) ? "" : text;
        }
        case "!":
        {
          return (value === undefined) ? text : "";
        }
        default:
        {
          return value ?? "";
        }
      }
    };

    const output = template.
      replaceAll(tokenRe, replacer).
      replaceAll(tokenRe, replacer);
    logError(output);
  }
};

module.exports = outputFormatter;
