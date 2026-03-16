// @ts-check

import jsoncParse from "./jsonc-parse.mjs";
import tomlParse from "./toml-parse.mjs";
import yamlParse from "./yaml-parse.mjs";

/**
 * Array of parser objects ordered by priority.
 * @type {import("markdownlint").ConfigurationParser[]}
 */
const parsers = [
  jsoncParse,
  yamlParse,
  // TOML files can be (incorrectly) read by yamlParse (but not vice versa), so tomlParse needs to go before yamlParse
  tomlParse
];

export default parsers;
