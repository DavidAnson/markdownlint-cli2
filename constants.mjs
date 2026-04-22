// @ts-check

const packageName = "markdownlint-cli2";
const packageVersion = "0.22.1";

const libraryName = "markdownlint";

const cli2SchemaKeys = new Set([
  "config",
  "customRules",
  "fix",
  "frontMatter",
  "gitignore",
  "globs",
  "ignores",
  "markdownItPlugins",
  "modulePaths",
  "noBanner",
  "noInlineConfig",
  "noProgress",
  "outputFormatters",
  "showFound"
]);

export {
  cli2SchemaKeys,
  libraryName,
  packageName,
  packageVersion
};
