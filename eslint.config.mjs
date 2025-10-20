import js from "@eslint/js";
import eslintPluginJsdoc from "eslint-plugin-jsdoc";
import eslintPluginNode from "eslint-plugin-n";
import eslintPluginStylistic from "@stylistic/eslint-plugin";
import eslintPluginUnicorn from "eslint-plugin-unicorn";

export default [
  js.configs.all,
  eslintPluginJsdoc.configs["flat/recommended"],
  eslintPluginNode.configs["flat/recommended"],
  eslintPluginStylistic.configs.customize({
    "arrowParens": true,
    "braceStyle": "1tbs",
    "commaDangle": "never",
    "jsx": false,
    "quoteProps": "always",
    "quotes": "double",
    "semi": true
  }),
  eslintPluginUnicorn.configs["flat/all"],
  {
    "ignores": [
      "test/*/**",
      "webworker/markdownlint-cli2-webworker.cjs",
      "webworker/setImmediate.cjs"
    ]
  },
  {
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

      "unicorn/no-null": "off",
      "unicorn/prefer-string-raw": "off",
      "unicorn/prefer-string-replace-all": "off",
      "unicorn/prevent-abbreviations": "off"
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
  }
];
