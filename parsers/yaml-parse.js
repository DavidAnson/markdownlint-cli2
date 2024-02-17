// @ts-check

"use strict";

const yaml = require("js-yaml");

/**
 * Parses a YAML string, returning the corresponding object.
 * @param {string} text String to parse as YAML.
 * @returns {object} Corresponding object.
 */
const yamlParse = (text) => yaml.load(text);

module.exports = yamlParse;
