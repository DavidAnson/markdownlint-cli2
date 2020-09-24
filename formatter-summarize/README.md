# markdownlint-cli2-formatter-summarize

> An output formatter for [`markdownlint-cli2`][markdownlint-cli2] that
> summarizes the results

[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]

## Install

```shell
npm install markdownlint-cli2-formatter-summarize --save-dev
```

## Use

To summarize counts by file, use the following `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-summarize", { "byFile": true } ]
  ]
}
```

To summarize counts by rule, use the following `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-summarize", { "byRule": true } ]
  ]
}
```

To summarize counts by file by rule, use the following
`.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-summarize", { "byFileByRule": true } ]
  ]
}
```

To summarize counts by rule by file, use the following
`.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-summarize", { "byRuleByFile": true } ]
  ]
}
```

## Examples

`byFile`:

```text
Count File
    3 dir/about.md
    5 dir/subdir/info.md
    5 viewme.md
   13 [Total]
```

`byRule`:

```text
Count Rule
    1 MD009/no-trailing-spaces
    2 MD012/no-multiple-blanks
    1 MD019/no-multiple-space-atx
    1 MD021/no-multiple-space-closed-atx
    1 MD022/blanks-around-headings/blanks-around-headers
    1 MD025/single-title/single-h1
    1 MD029/ol-prefix
    1 MD032/blanks-around-lists
    2 MD038/no-space-in-code
    1 MD041/first-line-heading/first-line-h1
    1 MD047/single-trailing-newline
   13 [Total]
```

`byFileByRule`:

```text
dir/about.md
  Count Rule
      1 MD021/no-multiple-space-closed-atx
      1 MD029/ol-prefix
      1 MD032/blanks-around-lists
      3 [Total]
dir/subdir/info.md
  Count Rule
      1 MD012/no-multiple-blanks
      1 MD022/blanks-around-headings/blanks-around-headers
      2 MD038/no-space-in-code
      1 MD041/first-line-heading/first-line-h1
      5 [Total]
viewme.md
  Count Rule
      1 MD009/no-trailing-spaces
      1 MD012/no-multiple-blanks
      1 MD019/no-multiple-space-atx
      1 MD025/single-title/single-h1
      1 MD047/single-trailing-newline
      5 [Total]
```

`byRuleByFile`:

```text
MD009/no-trailing-spaces
  Count File
      1 viewme.md
      1 [Total]
MD012/no-multiple-blanks
  Count File
      1 dir/subdir/info.md
      1 viewme.md
      2 [Total]
MD019/no-multiple-space-atx
  Count File
      1 viewme.md
      1 [Total]
MD021/no-multiple-space-closed-atx
  Count File
      1 dir/about.md
      1 [Total]
MD022/blanks-around-headings/blanks-around-headers
  Count File
      1 dir/subdir/info.md
      1 [Total]
MD025/single-title/single-h1
  Count File
      1 viewme.md
      1 [Total]
MD029/ol-prefix
  Count File
      1 dir/about.md
      1 [Total]
MD032/blanks-around-lists
  Count File
      1 dir/about.md
      1 [Total]
MD038/no-space-in-code
  Count File
      2 dir/subdir/info.md
      2 [Total]
MD041/first-line-heading/first-line-h1
  Count File
      1 dir/subdir/info.md
      1 [Total]
MD047/single-trailing-newline
  Count File
      1 viewme.md
      1 [Total]
```

## History

- 0.0.1 - Initial release
- 0.0.2 - Add `byFileByRule`

<!-- markdownlint-disable line-length -->

[license-image]: https://img.shields.io/npm/l/markdownlint-cli2-formatter-summarize.svg
[license-url]: https://opensource.org/licenses/MIT
[markdownlint-cli2]: https://github.com/DavidAnson/markdownlint-cli2
[npm-image]: https://img.shields.io/npm/v/markdownlint-cli2-formatter-summarize.svg
[npm-url]: https://www.npmjs.com/package/markdownlint-cli2-formatter-summarize
