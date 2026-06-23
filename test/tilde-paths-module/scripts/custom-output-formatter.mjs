// @ts-check

import { deepFreeze } from "../../deep-freeze.cjs";

/** @type {import("markdownlint-cli2").OutputFormatter} */

const formatter = (options, params) => {
  const { logError, results } = options;
  for (const result of results) {
    const { fileName, lineNumber, ruleNames } = result;
    logError(`${fileName} ${lineNumber} ${ruleNames.join("/")}`);
  }
};

const frozenFormatter = deepFreeze(formatter);

export default frozenFormatter;
