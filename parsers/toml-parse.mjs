// @ts-check

import toml from "smol-toml";

const isObject = (/** @type {any} */ value) => Boolean(value) && (typeof value === "object") && !Array.isArray(value);

const findMarkdownlintConfig = (/** @type {any} */ value) => {
  if (!isObject(value)) {
    return null;
  }
  if (isObject(value.markdownlint)) {
    return value.markdownlint;
  }
  for (const nestedValue of Object.values(value)) {
    const markdownlintConfig = findMarkdownlintConfig(nestedValue);
    if (markdownlintConfig) {
      return markdownlintConfig;
    }
  }
  return null;
};

/**
 * Parses a TOML string, returning the corresponding object.
 * @type {import("markdownlint").ConfigurationParser}
 */
const tomlParse = (text) => {
  const parsed = toml.parse(text);
  const pyprojectMarkdownlintConfig = findMarkdownlintConfig(parsed);
  return (
    (pyprojectMarkdownlintConfig && (typeof pyprojectMarkdownlintConfig === "object") && !Array.isArray(pyprojectMarkdownlintConfig)) ?
      pyprojectMarkdownlintConfig :
      parsed
  );
};

export { findMarkdownlintConfig };
export default tomlParse;
