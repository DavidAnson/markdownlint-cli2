// @ts-check

const formatter = (options, params) => {
  const { logError, results } = options;
  for (const result of results) {
    const { fileName, lineNumber, ruleNames } = result;
    logError(`${fileName} ${lineNumber} ${ruleNames.join("/")}`);
  }
};

export default formatter;
