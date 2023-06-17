# markdownlint-cli2-formatter-junit

> An output formatter for [`markdownlint-cli2`][markdownlint-cli2] that writes
> results to a file in [JUnit XML format][junit-format]

[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]

## Install

```bash
npm install markdownlint-cli2-formatter-junit --save-dev
```

## Use

For the default output file name of `"markdownlint-cli2-junit.xml"`, use
the following `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-junit" ]
  ]
}
```

To customize the output file name, use the following `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-junit", { "name": "custom-name.xml" } ]
  ]
}
```

## Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="markdownlint-cli2-formatter-junit" time="0" tests="5" failures="5" errors="0" skipped="0">
    <testcase classname="viewme.md" name="MD009/no-trailing-spaces" time="0">
      <failure message="Trailing spaces">
        <![CDATA[Line 3, Column 10, Expected: 0 or 2; Actual: 1]]>
      </failure>
    </testcase>
    <testcase classname="viewme.md" name="MD012/no-multiple-blanks" time="0">
      <failure message="Multiple consecutive blank lines">
        <![CDATA[Line 5, Expected: 1; Actual: 2]]>
      </failure>
    </testcase>
    <testcase classname="viewme.md" name="MD025/single-title/single-h1" time="0">
      <failure message="Multiple top-level headings in the same document">
        <![CDATA[Line 6, Context: "# Description"]]>
      </failure>
    </testcase>
    <testcase classname="viewme.md" name="MD019/no-multiple-space-atx" time="0">
      <failure message="Multiple spaces after hash on atx style heading">
        <![CDATA[Line 12, Column 1, Context: "##  Summary"]]>
      </failure>
    </testcase>
    <testcase classname="viewme.md" name="MD047/single-trailing-newline" time="0">
      <failure message="Files should end with a single newline character">
        <![CDATA[Line 14, Column 14]]>
      </failure>
    </testcase>
  </testsuite>
</testsuites>
```

[junit-format]: https://github.com/testmoapp/junitxml
[license-image]: https://img.shields.io/npm/l/markdownlint-cli2-formatter-junit.svg
[license-url]: https://opensource.org/licenses/MIT
[markdownlint-cli2]: https://github.com/DavidAnson/markdownlint-cli2
[npm-image]: https://img.shields.io/npm/v/markdownlint-cli2-formatter-junit.svg
[npm-url]: https://www.npmjs.com/package/markdownlint-cli2-formatter-junit
