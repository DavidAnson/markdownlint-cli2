// @ts-check

"use strict";

const yaml = require("yaml");

/**
 * Parses a YAML string, returning the corresponding object.
 *
 * @param {string} text String to parse as YAML.
 * @returns {object} Corresponding object.
 */
const yamlParse = (text) => yaml.parse(text);

module.exports = yamlParse;
