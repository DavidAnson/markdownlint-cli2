# markdownlint-cli2-formatter-json

> An output formatter for [`markdownlint-cli2`][markdownlint-cli2] that writes
> results to a file in [JSON][json] format

[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]

## Install

```shell
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
    "fileName": "dir/about.md",
    "lineNumber": 1,
    "ruleNames": [
      "MD021",
      "no-multiple-space-closed-atx"
    ],
    "ruleDescription": "Multiple spaces inside hashes on closed atx style heading",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md021",
    "errorDetail": null,
    "errorContext": "#  About  #",
    "errorRange": [
      1,
      4
    ],
    "fixInfo": {
      "editColumn": 1,
      "deleteCount": 11,
      "insertText": "# About #"
    },
    "counter": 5
  },
  {
    "fileName": "dir/about.md",
    "lineNumber": 4,
    "ruleNames": [
      "MD032",
      "blanks-around-lists"
    ],
    "ruleDescription": "Lists should be surrounded by blank lines",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md032",
    "errorDetail": null,
    "errorContext": "1. List",
    "errorRange": null,
    "fixInfo": {
      "insertText": "\n"
    },
    "counter": 7
  },
  {
    "fileName": "dir/about.md",
    "lineNumber": 5,
    "ruleNames": [
      "MD029",
      "ol-prefix"
    ],
    "ruleDescription": "Ordered list item prefix",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md029",
    "errorDetail": "Expected: 2; Actual: 3; Style: 1/2/3",
    "errorContext": null,
    "errorRange": [
      1,
      3
    ],
    "fixInfo": null,
    "counter": 6
  },
  {
    "fileName": "dir/subdir/info.md",
    "lineNumber": 1,
    "ruleNames": [
      "MD022",
      "blanks-around-headings",
      "blanks-around-headers"
    ],
    "ruleDescription": "Headings should be surrounded by blank lines",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md022",
    "errorDetail": "Expected: 1; Actual: 0; Below",
    "errorContext": "## Information",
    "errorRange": null,
    "fixInfo": {
      "lineNumber": 2,
      "insertText": "\n"
    },
    "counter": 9
  },
  {
    "fileName": "dir/subdir/info.md",
    "lineNumber": 1,
    "ruleNames": [
      "MD041",
      "first-line-heading",
      "first-line-h1"
    ],
    "ruleDescription": "First line in file should be a top level heading",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md041",
    "errorDetail": null,
    "errorContext": "## Information",
    "errorRange": null,
    "fixInfo": null,
    "counter": 12
  },
  {
    "fileName": "dir/subdir/info.md",
    "lineNumber": 2,
    "ruleNames": [
      "MD038",
      "no-space-in-code"
    ],
    "ruleDescription": "Spaces inside code span elements",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md038",
    "errorDetail": null,
    "errorContext": "` code1`",
    "errorRange": [
      6,
      8
    ],
    "fixInfo": {
      "editColumn": 7,
      "deleteCount": 6,
      "insertText": "code1"
    },
    "counter": 10
  },
  {
    "fileName": "dir/subdir/info.md",
    "lineNumber": 2,
    "ruleNames": [
      "MD038",
      "no-space-in-code"
    ],
    "ruleDescription": "Spaces inside code span elements",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md038",
    "errorDetail": null,
    "errorContext": "`code2 `",
    "errorRange": [
      20,
      8
    ],
    "fixInfo": {
      "editColumn": 21,
      "deleteCount": 6,
      "insertText": "code2"
    },
    "counter": 11
  },
  {
    "fileName": "dir/subdir/info.md",
    "lineNumber": 4,
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
    },
    "counter": 8
  },
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
    },
    "counter": 0
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
    },
    "counter": 1
  },
  {
    "fileName": "viewme.md",
    "lineNumber": 6,
    "ruleNames": [
      "MD025",
      "single-title",
      "single-h1"
    ],
    "ruleDescription": "Multiple top level headings in the same document",
    "ruleInformation": "https://github.com/DavidAnson/markdownlint/blob/v0.20.4/doc/Rules.md#md025",
    "errorDetail": null,
    "errorContext": "# Description",
    "errorRange": null,
    "fixInfo": null,
    "counter": 3
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
    },
    "counter": 2
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
    },
    "counter": 4
  }
]
```

## History

- 0.0.1 - Initial release

<!-- markdownlint-disable line-length -->

[json]: https://wikipedia.org/wiki/JSON
[license-image]: https://img.shields.io/npm/l/markdownlint-cli2-formatter-json.svg
[license-url]: https://opensource.org/licenses/MIT
[markdownlint-cli]: https://github.com/igorshubovych/markdownlint-cli
[markdownlint-cli2]: https://github.com/DavidAnson/markdownlint-cli2
[npm-image]: https://img.shields.io/npm/v/markdownlint-cli2-formatter-json.svg
[npm-url]: https://www.npmjs.com/package/markdownlint-cli2-formatter-json
