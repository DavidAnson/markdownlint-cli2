// @ts-check

const options = {
  "customRules": [
    (new URL(
      "../node_modules/markdownlint-rule-sample-commonjs/sample-rule.cjs",
      import.meta.url
    )).toString(),
    (new URL(
      "../node_modules/markdownlint-rule-sample-module/sample-rule.mjs",
      import.meta.url
    )).toString()
  ]
};

export default options;
