# markdownlint-cli2-formatter-pretty

> An output formatter for [`markdownlint-cli2`][markdownlint-cli2] that looks
> like `markdownlint-cli2-formatter-default` with color and clickable links

[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]

## Install

```bash
npm install markdownlint-cli2-formatter-pretty --save-dev
```

## Use

To enable this formatter, use the following `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-pretty" ]
  ]
}
```

Many terminals support color, but support for clickable links (implemented by
[terminal-link][terminal-link]) is not as widespread. Where possible, rule names
in output are rendered as clickable links with information about the rule.

To append informational links to the output instead (which may be clickable):

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-pretty", { "appendLink": true } ]
  ]
}
```

## Example

As an image:

![Example output showing text colors and link formatting][example-png]

And as text (which may have its formatting removed by GitHub, etc.):

<!-- markdownlint-disable line-length no-inline-html -->

<pre style="background:black">
<span style="color:#e850a8">dir/about.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">1</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">3</span> <span style="color:#7f7f7f">error</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md021.md">MD021/no-multiple-space-closed-atx</a></span> Multiple spaces inside hashes on closed atx style heading<span style="color:#aa5500"> [Context: "#  About  #"]</span>
<span style="color:#e850a8">dir/about.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">1</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">10</span> <span style="color:#7f7f7f">error</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md021.md">MD021/no-multiple-space-closed-atx</a></span> Multiple spaces inside hashes on closed atx style heading<span style="color:#aa5500"> [Context: "#  About  #"]</span>
<span style="color:#e850a8">dir/about.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">4</span> <span style="color:#7f7f7f">error</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md032.md">MD032/blanks-around-lists</a></span> Lists should be surrounded by blank lines<span style="color:#aa5500"> [Context: "1. List"]</span>
<span style="color:#e850a8">dir/about.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">5</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">1</span> <span style="color:#7f7f7f">error</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md029.md">MD029/ol-prefix</a></span> Ordered list item prefix<span style="color:#aa5500"> [Expected: 2; Actual: 3; Style: 1/2/3]</span>
<span style="color:#e850a8">dir/subdir/info.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">1</span> <span style="color:#7f7f7f">error</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md022.md">MD022/blanks-around-headings</a></span> Headings should be surrounded by blank lines<span style="color:#aa5500"> [Expected: 1; Actual: 0; Below] [Context: "## Information"]</span>
<span style="color:#e850a8">dir/subdir/info.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">1</span> <span style="color:#7f7f7f">error</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md041.md">MD041/first-line-heading/first-line-h1</a></span> First line in a file should be a top-level heading<span style="color:#aa5500"> [Context: "## Information"]</span>
<span style="color:#e850a8">dir/subdir/info.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">2</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">7</span> <span style="color:#7f7f7f">error</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md038.md">MD038/no-space-in-code</a></span> Spaces inside code span elements<span style="color:#aa5500"> [Context: "` code1`"]</span>
<span style="color:#e850a8">dir/subdir/info.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">2</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">26</span> <span style="color:#7f7f7f">error</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md038.md">MD038/no-space-in-code</a></span> Spaces inside code span elements<span style="color:#aa5500"> [Context: "`code2 `"]</span>
<span style="color:#e850a8">dir/subdir/info.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">4</span> <span style="color:#7f7f7f">warning</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md012.md">MD012/no-multiple-blanks</a></span> Multiple consecutive blank lines<span style="color:#aa5500"> [Expected: 1; Actual: 2]</span>
<span style="color:#e850a8">viewme.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">3</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">10</span> <span style="color:#7f7f7f">error</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md009.md">MD009/no-trailing-spaces</a></span> Trailing spaces<span style="color:#aa5500"> [Expected: 0 or 2; Actual: 1]</span>
<span style="color:#e850a8">viewme.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">5</span> <span style="color:#7f7f7f">warning</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md012.md">MD012/no-multiple-blanks</a></span> Multiple consecutive blank lines<span style="color:#aa5500"> [Expected: 1; Actual: 2]</span>
<span style="color:#e850a8">viewme.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">6</span> <span style="color:#7f7f7f">error</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md025.md">MD025/single-title/single-h1</a></span> Multiple top-level headings in the same document<span style="color:#aa5500"> [Context: "Description"]</span>
<span style="color:#e850a8">viewme.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">12</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">4</span> <span style="color:#7f7f7f">error</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md019.md">MD019/no-multiple-space-atx</a></span> Multiple spaces after hash on atx style heading<span style="color:#aa5500"> [Context: "##  Summary"]</span>
<span style="color:#e850a8">viewme.md</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">14</span><span style="color:#00aaaa">:</span><span style="color:#00aa00">14</span> <span style="color:#7f7f7f">warning</span> <span style="color:#aa5500"><a href="https://github.com/DavidAnson/markdownlint/blob/v0.39.0/doc/md047.md">MD047/single-trailing-newline</a></span> Files should end with a single newline character</span>
</pre>

[example-png]: example.png
[license-image]: https://img.shields.io/npm/l/markdownlint-cli2-formatter-pretty.svg
[license-url]: https://opensource.org/licenses/MIT
[markdownlint-cli2]: https://github.com/DavidAnson/markdownlint-cli2
[npm-image]: https://img.shields.io/npm/v/markdownlint-cli2-formatter-pretty.svg
[npm-url]: https://www.npmjs.com/package/markdownlint-cli2-formatter-pretty
[terminal-link]: https://github.com/sindresorhus/terminal-link
