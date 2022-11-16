# markdownlint-cli2-formatter-codequality

> An output formatter for [`markdownlint-cli2`][markdownlint-cli2] that writes
> results to a [GitLab Code Quality report artifact][gitlab] [JSON][json] file
> (a subset of the [CodeClimate specification][codeclimate])

[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]

## Install

```shell
npm install markdownlint-cli2-formatter-codequality --save-dev
```

## Use

Use the following `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-codequality" ]
  ]
}
```

## Use in GitLab CI

```yaml
markdownlint:
  stage: lint
  image:
    name: davidanson/markdownlint-cli2:<version>
    entrypoint: [""]
  before_script:
    - npm install markdownlint-cli2-formatter-gitlab
  script:
    - markdownlint-cli2 "**/*.md"
  artifacts:
    when: always
    expire_in: 1 week
    reports:
      codequality: markdownlint-cli2-codequality.json

```

## Example Output

```json
[
  {
    "type": "issue",
    "check_name": "MD009/no-trailing-spaces",
    "description": "MD009/no-trailing-spaces: Trailing spaces [Expected: 0 or 2; Actual: 1]",
    "severity": "minor",
    "fingerprint": "3aa1153b47e6e931b5c75c8d225c0e5115d0b5b7ddb866f07d1c055ebefce9ba",
    "location": {
      "path": "viewme.md",
      "lines": {
        "begin": 3
      }
    }
  },
  {
    "type": "issue",
    "check_name": "MD012/no-multiple-blanks",
    "description": "MD012/no-multiple-blanks: Multiple consecutive blank lines [Expected: 1; Actual: 2]",
    "severity": "minor",
    "fingerprint": "17a92ede614b1a8ae84d4c9280ccf81597d743b1468a9b1fa772f2a3ec7b24a7",
    "location": {
      "path": "viewme.md",
      "lines": {
        "begin": 5
      }
    }
  },
  {
    "type": "issue",
    "check_name": "MD025/single-title/single-h1",
    "description": "MD025/single-title/single-h1: Multiple top-level headings in the same document",
    "severity": "minor",
    "fingerprint": "fdaf89fa8699a65b8643bb84683f92877e7e265b3b2f72693db0573a51fd35e0",
    "location": {
      "path": "viewme.md",
      "lines": {
        "begin": 6
      }
    }
  },
  {
    "type": "issue",
    "check_name": "MD019/no-multiple-space-atx",
    "description": "MD019/no-multiple-space-atx: Multiple spaces after hash on atx style heading",
    "severity": "minor",
    "fingerprint": "9bdc18e30b15325e3244aacbc829c0dedd4b8e98623ec493c722467904f6e185",
    "location": {
      "path": "viewme.md",
      "lines": {
        "begin": 12
      }
    }
  },
  {
    "type": "issue",
    "check_name": "MD047/single-trailing-newline",
    "description": "MD047/single-trailing-newline: Files should end with a single newline character",
    "severity": "minor",
    "fingerprint": "93ae8c90e68289845adbba6f576b307cb8715fbc8709c78aeb56a1dbb439f641",
    "location": {
      "path": "viewme.md",
      "lines": {
        "begin": 14
      }
    }
  }
]
```

<!-- markdownlint-disable line-length -->

[codeclimate]: https://github.com/codeclimate/platform/blob/master/spec/analyzers/SPEC.md#data-types
[gitlab]: https://docs.gitlab.com/ee/ci/testing/code_quality.html#implementing-a-custom-tool
[json]: https://wikipedia.org/wiki/JSON
[license-image]: https://img.shields.io/npm/l/markdownlint-cli2-formatter-codequality.svg
[license-url]: https://opensource.org/licenses/MIT
[markdownlint-cli2]: https://github.com/DavidAnson/markdownlint-cli2
[npm-image]: https://img.shields.io/npm/v/markdownlint-cli2-formatter-codequality.svg
[npm-url]: https://www.npmjs.com/package/markdownlint-cli2-formatter-codequality
