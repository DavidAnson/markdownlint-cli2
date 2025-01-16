// @ts-check

import { deepEqual } from "node:assert";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { __dirname } from "../esm-helpers.mjs";

/** @type {import("markdownlint").Rule} */
export default {
  "names": [ "assert-markdown-it-tokens" ],
  "description": "Rule that asserts markdown-it tokens",
  "tags": [ "test" ],
  "parser": "markdownit",
  "function": (params) => {
    const file = resolve(
      __dirname(import.meta),
      params.config.file
    );
    const actual = params.parsers.markdownit.tokens;
    const expected = JSON.parse(
      readFileSync(
        file,
        "utf8"
      )
    );
    writeFileSync(
      file,
      JSON.stringify(
        actual,
        null,
        2
      ),
      "utf8"
    );
    deepEqual(actual, expected);
  }
};
