// @ts-check

"use strict";

/** @typedef {import("../markdownlint-cli2.mjs").OutputFormatterOptions} OutputFormatterOptions */

/**
 * @typedef {object} Parameters
 * @property {string} template Template
 */

// eslint-disable-next-line no-template-curly-in-string
const defaultTemplate = "fileName=\"${fileName}\" lineNumber=${lineNumber} ${columnNumber:columnNumber=${columnNumber} }ruleName=${ruleName} ruleDescription=\"${ruleDescription}\" ruleInformation=${ruleInformation} errorContext=\"${errorContext}\" errorDetail=\"${errorDetail}\" errorSeverity=\"${errorSeverity}\"";

// Use separate regular expressions to avoid a polynomial worst case
const tokenRes = [ "fileName", "lineNumber", "columnNumber", "ruleName", "ruleDescription", "ruleInformation", "errorContext", "errorDetail", "errorSeverity" ].
  map((token) => new RegExp(`\\$\\{(${token})(?:([:!])([^{}]*\\{[^{}]+\\}[^{}]*|[^}]+))?\\}`, "gu"));

// Output markdownlint-cli2 results using a template
const outputFormatter = (/** @type {OutputFormatterOptions} */ options, /** @type {Parameters} */ params) => {
  const { logError, results } = options;
  const template = params?.template || defaultTemplate;

  for (const result of results) {
    const tokenToResult = {
      "fileName": result.fileName,
      "lineNumber": result.lineNumber,
      "columnNumber": result.errorRange?.[0],
      "ruleName": result.ruleNames.join("/"),
      "ruleDescription": result.ruleDescription,
      "ruleInformation": result.ruleInformation,
      "errorContext": result.errorContext,
      "errorDetail": result.errorDetail,
      "errorSeverity": result.severity
    };

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const replacer = (/** @type {string} */ match, /** @type {string} */ token, /** @type {string} */ type, /** @type {string} */ text) => {
      // @ts-ignore
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

    let output = template;
    for (const tokenRe of tokenRes) {
      output = output.replaceAll(tokenRe, replacer).replaceAll(tokenRe, replacer);
    }
    logError(output);
  }
};

module.exports = outputFormatter;
