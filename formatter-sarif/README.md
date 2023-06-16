# markdownlint-cli2-formatter-sarif

> An output formatter for [`markdownlint-cli2`][markdownlint-cli2] that writes
> results to a file in [Static Analysis Results Interchange Format/SARIF][sarif]

[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]

## Install

```bash
npm install markdownlint-cli2-formatter-sarif --save-dev
```

## Use

For the default output file name of `"markdownlint-cli2-sarif.sarif"`, use
the following `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-sarif" ]
  ]
}
```

To customize the output file name, use the following `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-sarif", { "name": "custom-name.sarif" } ]
  ]
}
```

## Example

```json
{
  "$schema": "https://json.schemastore.org/sarif-2.1.0.json",
  "version": "2.1.0",
  "runs": [
    {
      "tool": {
        "driver": {
          "name": "markdownlint-cli2-formatter-sarif",
          "version": "0.0.1",
          "informationUri": "https://github.com/DavidAnson/markdownlint-cli2",
          "rules": [
            {
              "id": "MD009",
              "name": "Md009NoTrailingSpaces",
              "shortDescription": {
                "text": "Trailing spaces"
              },
              "fullDescription": {
                "text": "Trailing spaces"
              },
              "helpUri": "https://github.com/DavidAnson/markdownlint/blob/v0.29.0/doc/md009.md"
            },
            {
              "id": "MD012",
              "name": "Md012NoMultipleBlanks",
              "shortDescription": {
                "text": "Multiple consecutive blank lines"
              },
              "fullDescription": {
                "text": "Multiple consecutive blank lines"
              },
              "helpUri": "https://github.com/DavidAnson/markdownlint/blob/v0.29.0/doc/md012.md"
            },
            {
              "id": "MD025",
              "name": "Md025SingleTitleSingleH1",
              "shortDescription": {
                "text": "Multiple top-level headings in the same document"
              },
              "fullDescription": {
                "text": "Multiple top-level headings in the same document"
              },
              "helpUri": "https://github.com/DavidAnson/markdownlint/blob/v0.29.0/doc/md025.md"
            },
            {
              "id": "MD019",
              "name": "Md019NoMultipleSpaceAtx",
              "shortDescription": {
                "text": "Multiple spaces after hash on atx style heading"
              },
              "fullDescription": {
                "text": "Multiple spaces after hash on atx style heading"
              },
              "helpUri": "https://github.com/DavidAnson/markdownlint/blob/v0.29.0/doc/md019.md"
            },
            {
              "id": "MD047",
              "name": "Md047SingleTrailingNewline",
              "shortDescription": {
                "text": "Files should end with a single newline character"
              },
              "fullDescription": {
                "text": "Files should end with a single newline character"
              },
              "helpUri": "https://github.com/DavidAnson/markdownlint/blob/v0.29.0/doc/md047.md"
            }
          ]
        }
      },
      "results": [
        {
          "ruleId": "MD009",
          "message": {
            "text": "Trailing spaces, Expected: 0 or 2; Actual: 1"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "viewme.md"
                },
                "region": {
                  "startLine": 3,
                  "endLine": 3,
                  "startColumn": 10,
                  "endColumn": 11
                }
              }
            }
          ]
        },
        {
          "ruleId": "MD012",
          "message": {
            "text": "Multiple consecutive blank lines, Expected: 1; Actual: 2"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "viewme.md"
                },
                "region": {
                  "startLine": 5,
                  "endLine": 5
                }
              }
            }
          ]
        },
        {
          "ruleId": "MD025",
          "message": {
            "text": "Multiple top-level headings in the same document, Context: \"# Description\""
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "viewme.md"
                },
                "region": {
                  "startLine": 6,
                  "endLine": 6
                }
              }
            }
          ]
        },
        {
          "ruleId": "MD019",
          "message": {
            "text": "Multiple spaces after hash on atx style heading, Context: \"##  Summary\""
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "viewme.md"
                },
                "region": {
                  "startLine": 12,
                  "endLine": 12,
                  "startColumn": 1,
                  "endColumn": 6
                }
              }
            }
          ]
        },
        {
          "ruleId": "MD047",
          "message": {
            "text": "Files should end with a single newline character"
          },
          "locations": [
            {
              "physicalLocation": {
                "artifactLocation": {
                  "uri": "viewme.md"
                },
                "region": {
                  "startLine": 14,
                  "endLine": 14,
                  "startColumn": 14,
                  "endColumn": 15
                }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

[license-image]: https://img.shields.io/npm/l/markdownlint-cli2-formatter-sarif.svg
[license-url]: https://opensource.org/licenses/MIT
[markdownlint-cli2]: https://github.com/DavidAnson/markdownlint-cli2
[npm-image]: https://img.shields.io/npm/v/markdownlint-cli2-formatter-sarif.svg
[npm-url]: https://www.npmjs.com/package/markdownlint-cli2-formatter-sarif
[sarif]: https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/sarif-support-for-code-scanning
