// @ts-check

import yaml from "js-yaml";

/* eslint-disable arrow-body-style */

/**
 * Parses a YAML string, returning the corresponding object.
 * @param {string} text String to parse as YAML.
 * @returns {object} Corresponding object.
 */
const yamlParse = (text) => {
  // @ts-ignore
  return yaml.load(text);
};

export default yamlParse;
