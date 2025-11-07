// @ts-check

import yaml from "js-yaml";

/* eslint-disable arrow-body-style */

/**
 * Parses a YAML string, returning the corresponding object.
 * @type {import("markdownlint").ConfigurationParser}
 */
const yamlParse = (text) => {
  // @ts-ignore
  return yaml.load(text);
};

export default yamlParse;
