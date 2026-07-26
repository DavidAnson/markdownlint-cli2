// @ts-check

import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import eslintNodeTest from "eslint-node-test";
import eslintPackageJson from "eslint-package-json";
import eslintPluginJsdoc from "eslint-plugin-jsdoc";
import eslintPluginN from "eslint-plugin-n";
import eslintPluginStylistic from "@stylistic/eslint-plugin";
import eslintPluginUnicorn from "eslint-plugin-unicorn";

export default defineConfig(
  {
    "ignores": [
      "**/package.json"
    ],
    "plugins": {
      js,
      "jsdoc": eslintPluginJsdoc,
      "n": eslintPluginN,
      "node-test": eslintNodeTest,
      "unicorn": eslintPluginUnicorn,
      "@stylistic": eslintPluginStylistic
    },
    "extends": [
      "js/all",
      "jsdoc/recommended",
      "n/all",
      "node-test/all",
      "unicorn/all",
      eslintPluginStylistic.configs.customize({
        "arrowParens": true,
        "braceStyle": "1tbs",
        "commaDangle": "never",
        "jsx": false,
        "quoteProps": "always",
        "quotes": "double",
        "semi": true
      })
    ],
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
      "no-inline-comments": [ "error", { "ignorePattern": " @type \\{.+\\} " } ],
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

      "@stylistic/array-bracket-spacing": [ "error", "always" ],
      "@stylistic/dot-location": [ "error", "object" ],
      "@stylistic/operator-linebreak": [ "error", "after", { "overrides": { "?": "before", ":": "before" } } ],
      "@stylistic/padded-blocks": "off",

      "n/no-top-level-await": [ "error", { "ignoreBin": true } ],

      "node-test/no-constant-assertion": "off",
      "node-test/no-import-test-files": "off",
      "node-test/consistent-assert-throws-callback-style": "off",
      "node-test/consistent-test-filename": "off",
      "node-test/consistent-test-it": "off",
      "node-test/max-assertions": "off",
      "node-test/no-conditional-assertion": "off",
      "node-test/no-conditional-in-test": "off",
      "node-test/prefer-async-await": "off",
      "node-test/prefer-lowercase-title": "off",
      "node-test/prefer-strict-assert": "off",

      "unicorn/consistent-boolean-name": "off",
      "unicorn/default-export-style": [ "error", { "functions": "separate" } ],
      "unicorn/max-nested-calls": "off",
      "unicorn/name-replacements": "off",
      "unicorn/no-asterisk-prefix-in-documentation-comments": "off",
      "unicorn/no-null": "off",
      "unicorn/prefer-string-raw": "off",
      "unicorn/prefer-string-replace-all": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/prefer-await": "off",
      "unicorn/try-complexity": "off"
    }
  },
  {
    "ignores": [
      "test/*/**",
      "webworker/markdownlint-cli2-webworker.cjs",
      "webworker/setImmediate.cjs"
    ]
  },
  {
    "files": [
      "test/**/*.mjs"
    ],
    "rules": {
      "n/no-unsupported-features/node-builtins": [ "error", { "allowExperimental": true } ]
    }
  },
  {
    "files": [
      "**/*-formatter-*.js",
      "webworker/*.cjs"
    ],
    "languageOptions": {
      "sourceType": "commonjs",
      "globals": {
        "__dirname": "readonly",
        "__filename": "readonly",
        "module": "readonly",
        "require": "readonly"
      }
    },
    "rules": {
      "unicorn/prefer-module": "off"
    }
  },
  {
    "files": [
      "**/package.json"
    ],
    "plugins": {
      "package-json": eslintPackageJson
    },
    "extends": [
      "package-json/all"
    ],
    "rules": {
      "package-json/dependency-version-range": [ "error", { "range": "exact" } ],
      "package-json/no-redundant-files": "off",
      "package-json/peer-dependencies-as-dev-dependencies": "off",
      "package-json/prefer-side-effects-field": "off",
      "package-json/require-private": "off",
      "package-json/sort-dependencies": "off",
      "package-json/sort-files": "off",
      "package-json/sort-properties": "off"
    }
  },
  {
    "files": [
      "formatter-*/package.json"
    ],
    "rules": {
      "package-json/prefer-exports": "off",
      "package-json/prefer-type-module": "off",
      "package-json/require-engines": "off"
    }
  }
);
