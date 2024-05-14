import js from "@eslint/js";
import eslintPluginJsdoc from "eslint-plugin-jsdoc";
import eslintPluginNode from "eslint-plugin-n";
import eslintPluginUnicorn from "eslint-plugin-unicorn";

export default [
  js.configs.all,
  eslintPluginJsdoc.configs['flat/recommended'],
  eslintPluginNode.configs["flat/recommended"],
  eslintPluginUnicorn.configs["flat/all"],
  {
    "ignores": [
      "test/*/**",
      "webworker/markdownlint-cli2-webworker.js",
      "webworker/setImmediate.js"
    ]
  },
  {
    "languageOptions": {
      "sourceType": "commonjs"
    },
    "linterOptions": {
      "reportUnusedDisableDirectives": true
    },
    "rules": {
      "capitalized-comments": "off",
      "complexity": "off",
      "guard-for-in": "off",
      "id-length": "off",
      "max-lines-per-function": "off",
      "max-lines": "off",
      "max-params": "off",
      "max-statements": "off",
      "multiline-comment-style": [ "error", "separate-lines" ],
      "no-console": "off",
      "no-magic-numbers": "off",
      "no-plusplus": "off",
      "no-ternary": "off",
      "no-undef-init": "off",
      "no-undefined": "off",
      "no-useless-assignment": "off",
      "one-var": "off",
      "require-atomic-updates": "off",
      "sort-keys": "off",
      "sort-imports": "off",

      "unicorn/no-null": "off",
      "unicorn/prefer-module": "off",
      "unicorn/prefer-string-raw": "off",
      "unicorn/prefer-string-replace-all": "off",
      "unicorn/prevent-abbreviations": "off"
    }
  },
  {
    "files": [
      "**/*.mjs"
    ],
    "languageOptions": {
      "sourceType": "module"
    }
  }
];
