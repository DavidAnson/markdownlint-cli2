# markdownlint-cli2-formatter-json

> An output formatter for [`markdownlint-cli2`][markdownlint-cli2] that writes
> results to a file in [JSON][json] format

[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]

## Install

```bash
npm install markdownlint-cli2-formatter-json --save-dev
```

## Use

For the default output file name of `"markdownlint-cli2-results.json"`, use
the following `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-json" ]
  ]
}
```

To customize the output file name or number of spaces to indent, use the
following `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-json", { "name": "custom-name.json", "spaces": 1 } ]
  ]
}
```

## Example

```json
[
  {
    "fileName": "viewme.md",
    "lineNumber": 3,
    "ruleNames": [
      "MD009",
      "no-trailing-spaces"
    ],
    "ruleDescription": "Trailing spaces",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md009",
    "errorDetail": "Expected: 0 or 2; Actual: 1",
    "errorContext": null,
    "errorRange": [
      10,
      1
    ],
    "fixInfo": {
      "editColumn": 10,
      "deleteCount": 1
    }
  },
  {
    "fileName": "viewme.md",
    "lineNumber": 5,
    "ruleNames": [
      "MD012",
      "no-multiple-blanks"
    ],
    "ruleDescription": "Multiple consecutive blank lines",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md012",
    "errorDetail": "Expected: 1; Actual: 2",
    "errorContext": null,
    "errorRange": null,
    "fixInfo": {
      "deleteCount": -1
    }
  },
  {
    "fileName": "viewme.md",
    "lineNumber": 6,
    "ruleNames": [
      "MD025",
      "single-title",
      "single-h1"
    ],
    "ruleDescription": "Multiple top-level headings in the same document",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md025",
    "errorDetail": null,
    "errorContext": "# Description",
    "errorRange": null,
    "fixInfo": null
  },
  {
    "fileName": "viewme.md",
    "lineNumber": 12,
    "ruleNames": [
      "MD019",
      "no-multiple-space-atx"
    ],
    "ruleDescription": "Multiple spaces after hash on atx style heading",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md019",
    "errorDetail": null,
    "errorContext": "##  Summary",
    "errorRange": [
      1,
      5
    ],
    "fixInfo": {
      "editColumn": 3,
      "deleteCount": 1
    }
  },
  {
    "fileName": "viewme.md",
    "lineNumber": 14,
    "ruleNames": [
      "MD047",
      "single-trailing-newline"
    ],
    "ruleDescription": "Files should end with a single newline character",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md047",
    "errorDetail": null,
    "errorContext": null,
    "errorRange": [
      14,
      1
    ],
    "fixInfo": {
      "editColumn": 15,
      "insertText": "\n"
    }
  }
]
```

[json]: https://wikipedia.org/wiki/JSON
[license-image]: https://img.shields.io/npm/l/markdownlint-cli2-formatter-json.svg
[license-url]: https://opensource.org/licenses/MIT
[markdownlint-cli2]: https://github.com/DavidAnson/markdownlint-cli2
[npm-image]: https://img.shields.io/npm/v/markdownlint-cli2-formatter-json.svg
[npm-url]: https://www.npmjs.com/package/markdownlint-cli2-formatter-json
