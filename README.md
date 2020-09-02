# markdownlint-cli2

> A fast, flexible, configuration-based command-line interface for linting
> Markdown/CommonMark files with the `markdownlint` library

[![npm version][npm-image]][npm-url]
[![CI Status][ci-image]][ci-url]
[![License][license-image]][license-url]

## Install

As a global CLI:

```shell
npm install markdownlint-cli2 --global
```

As a development dependency of the current package:

```shell
npm install markdownlint-cli2 --save-dev
```

## Overview

- [`markdownlint`][markdownlint] is a library for linting [Markdown][markdown]/
  [CommonMark][commonmark] files on [Node.js][nodejs] using the
  [markdown-it][markdown-it] parser.
- [`markdownlint-cli`][markdownlint-cli] is a traditional command-line interface
  for `markdownlint`.
- [`markdownlint-cli2`][markdownlint-cli2] is a slightly unconventional
  command-line interface for `markdownlint`.
- `markdownlint-cli2` is configuration-based and prioritizes speed and
  simplicity.
- `markdownlint-cli2` supports all the features of `markdownlint-cli` (sometimes
  a little differently).
- [`vscode-markdownlint`][vscode-markdownlint] is a `markdownlint` extension for
  the [Visual Studio Code editor][vscode].
- `markdownlint-cli2` is designed to work well in conjunction with
  `vscode-markdownlint`.

## Use

```text
markdownlint-cli2 version X.Y.Z by David Anson (https://dlaa.me/)
https://github.com/DavidAnson/markdownlint-cli2

Syntax: markdownlint-cli2 glob0 [glob1] [...] [globN]

Glob expressions (from the globby library):
- * matches any number of characters, but not /
- ? matches a single character, but not /
- ** matches any number of characters, including / (when it's the only thing in a path part)
- {} allows for a comma-separated list of "or" expressions
- ! or # at the beginning of a pattern negate the match

Dot-only glob:
- The command "markdownlint-cli2 ." would lint every file in the current directory tree which is probably not intended
- Instead, it is mapped to "markdownlint-cli2 *.{md,markdown}" which lints all Markdown files in the current directory
- To lint every file in the current directory tree, the command "markdownlint-cli2 **" can be used instead

Configuration via:
- .markdownlint-cli2.jsonc
- .markdownlint-cli2.yaml
- .markdownlint-cli2.js
- .markdownlint.jsonc or .markdownlint.json
- .markdownlint.yaml or .markdownlint.yml
- .markdownlint.js

Cross-platform compatibility:
- UNIX and Windows shells expand globs according to different rules, so quoting glob arguments is recommended
- Shells that expand globs do not support negated patterns (!node_modules), so quoting negated globs is required
- Some Windows shells do not handle single-quoted (') arguments correctly, so double-quotes (") are recommended
- Some UNIX shells handle exclamation (!) in double-quotes specially, so hashtag (#) is recommended for negated globs
- Some shells use backslash (\) to escape special characters, so forward slash (/) is the recommended path separator

Therefore, the most compatible glob syntax for cross-platform support:
$ markdownlint-cli2 "**/*.md" "#node_modules"
```

### Exit Codes

- `0`: Linting was successful and there were no errors
- `1`: Linting was successful and there were errors
- `2`: Linting was not completed due to a runtime issue

## Rule List

- See the [Rules / Aliases][markdownlint-rules-aliases] and
  [Tags][markdownlint-rules-tags] sections of the `markdownlint` documentation.

## Glob expressions

- Globbing is performed by the [globby][globby] library; refer to that
  documentation for more information and examples.

## Configuration

- See the [Configuration][markdownlint-configuration] section of the
  `markdownlint` documentation for information about the inline comment syntax
  for enabling and disabling rules with HTML comments.

### `.markdownlint-cli2.jsonc`

- The format of this file is a [JSONC][jsonc] object similar to the
  [`markdownlint` `options` object][markdownlint-options].
- Valid properties are:
  - `config`: [`markdownlint` `config` object][markdownlint-config] to configure
    rules for this part of the directory tree
    - If a `.markdownlint.{jsonc,json,yaml,yml,js}` file (see below) is present
      in the same directory, it overrides the value of this property
  - `customRules`: `Array` of `Strings` of module names/paths of
    [custom rules][markdownlint-custom-rules] to load and use when linting
    - Each `String` is passed as the `id` parameter to Node's
      [require function][nodejs-require]
    - Relative paths are resolved based on the location of the `JSONC` file
  - `fix`: `Boolean` value to enable fixing of linting errors reported by rules
    that emit fix information
    - Fixes are made directly to the relevant file(s); no backup is created
  - `frontMatter`: `String` defining the [`RegExp`][regexp] used to match and
    ignore any [front matter][front-matter] at the beginning of a document
    - The `String` is passed as the `pattern` parameter to the
      [`RegExp` constructor][regexp-constructor]
    - For example: `(^---\s*$[^]*?^---\s*$)(\r\n|\r|\n|$)`
  - `ignores`: `Array` of `Strings` defining glob expressions to ignore when
    linting
    - This setting has the best performance when applied to the directory from
      which `markdownlint-cli2` is run
      - In this case, glob expressions are negated (by adding a leading `!`) and
        appended to the command-line arguments before file enumeration
      - The setting is not inherited by nested configuration files in this case
    - When this setting is applied in subdirectories, ignoring of files is done
      after file enumeration, so large directories can negatively impact
      performance
      - Nested configuration files inherit and reapply the setting to the
        contents of nested directories in this case
  - `markdownItPlugins`: `Array` of `Array`s, each of which has a `String`
    naming a [markdown-it plugin][markdown-it-plugins] followed by parameters
    - Plugins can be used to add support for additional Markdown syntax
    - Relative paths are resolved based on the location of the `JSONC` file
    - For example: `[ [ "plugin-name", param_0, param_1, ... ], ... ]`
  - `noInlineConfig`: `Boolean` value to disable the support of
    [HTML comments][html-comment] within Markdown content
    - For example: `<!-- markdownlint-disable some-rule -->`
  - `noProgress`: `Boolean` value to disable the display of progress on `stdout`
    - This top-level setting is valid **only** in the directory from which
      `markdownlint-cli2` is run
  - `outputFormatters`: `Array` of `Array`s, each of which has a `String`
    naming a [markdownlint-cli2-formatter][markdownlint-cli2-formatter] followed
      by parameters
    - Formatters can be used to customize the tool's output for different
      scenarios
    - Relative paths are resolved based on the location of the `JSONC` file
    - For example: `[ [ "formatter-name", param_0, param_1, ... ], ... ]`
    - This top-level setting is valid **only** in the directory from which
      `markdownlint-cli2` is run
- Settings in this file apply to the directory it is in and all subdirectories.
- Settings **merge with** those applied by any versions of this file in a parent
  directory.
- For example: [`.markdownlint-cli2.jsonc`][markdownlint-cli2-jsonc] with all
  properties set

### `.markdownlint-cli2.yaml`

- The format of this file is a [YAML][yaml] object with the structure described
  above for `.markdownlint-cli2.jsonc`.
- Other details are the same as for `.markdownlint-cli2.jsonc` described above.
- If a `.markdownlint-cli2.jsonc` file is present in the same directory, it
  takes precedence.
- For example: [`.markdownlint-cli2.yaml`][markdownlint-cli2-yaml] with all
  properties set

### `.markdownlint-cli2.js`

- The format of this file is a [CommonJS module][commonjs-module] that exports
  the object described above for `.markdownlint-cli2.jsonc`.
- Other details are the same as for `.markdownlint-cli2.jsonc` described above.
- If a `.markdownlint-cli2.jsonc` or `.markdownlint-cli2.yaml` file is present
  in the same directory, it takes precedence.
- For example: [`.markdownlint-cli2.js`][markdownlint-cli2-js]

### `.markdownlint.jsonc` or `.markdownlint.json`

- The format of this file is a [JSONC][jsonc] or [JSON][json] object matching
  the [`markdownlint` `config` object][markdownlint-config].
- Settings in this file apply to the directory it is in and all subdirectories
- Settings **override** those applied by any versions of this file in a parent
  directory.
- If `jsonc` and `json` files are present in the same directory, the `jsonc`
  version takes precedence.
- To merge the settings of these files or share configuration, use the `extends`
  property (documented in the link above).
- Both file types support comments in JSON.
- For example: [`.markdownlint.jsonc`][markdownlint-jsonc]

### `.markdownlint.yaml` or `.markdownlint.yml`

- The format of this file is a [YAML][yaml] object representing the
  [`markdownlint` `config` object][markdownlint-config].
- Other details are the same as for `jsonc`/`json` files described above.
- If `yaml` and `yml` files are present in the same directory, the `yaml`
  version takes precedence.
- If a `jsonc` or `json` file is present in the same directory, it takes
  precedence.
- For example: [`.markdownlint.yaml`][markdownlint-yaml]

### `.markdownlint.js`

- The format of this file is a [CommonJS module][commonjs-module] that exports
  the [`markdownlint` `config` object][markdownlint-config].
- Other details are the same as for `jsonc`/`json` files described above.
- If a `jsonc`, `json`, `yaml`, or `yml` file is present in the same directory,
  it takes precedence.
- For example: [`.markdownlint.js`][markdownlint-js]

## Compatibility

### `markdownlint-cli`

- The glob implementation and handling of pattern matching is slightly
  different.
- Configuration files are supported in every directory (vs. only one at the
  root).
- The `INI` config format, `.markdownlintrc`, and `.markdownlintignore` are not
  supported.

### `vscode-markdownlint`

- `.markdownlintrc` and `.markdownlintignore` are not supported.

## History

- 0.0.2 - Initial release
- 0.0.3 - Feature parity with `markdownlint-cli`
- 0.0.4 - Support output formatters and `markdown-it` plugins
- 0.0.5 - Improve support for ignoring files
- 0.0.6 - Improve handling of very large directory trees
- 0.0.7 - Support `.markdownlint-cli2.js` and `.markdownlint.js`

<!-- markdownlint-disable line-length -->

[ci-image]: https://github.com/DavidAnson/markdownlint-cli2/workflows/CI/badge.svg?branch=main
[ci-url]: https://github.com/DavidAnson/markdownlint-cli2/actions?query=branch%3Amain
[commonmark]: https://commonmark.org/
[commonjs-module]: https://nodejs.org/api/modules.html#modules_modules_commonjs_modules
[front-matter]: https://jekyllrb.com/docs/frontmatter/
[globby]: https://www.npmjs.com/package/globby
[html-comment]: https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Getting_started
[json]: https://wikipedia.org/wiki/JSON
[jsonc]: https://code.visualstudio.com/Docs/languages/json#_json-with-comments
[license-image]: https://img.shields.io/npm/l/markdownlint-cli2.svg
[license-url]: https://opensource.org/licenses/MIT
[markdown]: https://wikipedia.org/wiki/Markdown
[markdown-it]: https://www.npmjs.com/package/markdown-it
[markdown-it-plugins]: https://www.npmjs.com/search?q=keywords:markdown-it-plugin
[markdownlint]: https://github.com/DavidAnson/markdownlint
[markdownlint-config]: https://github.com/DavidAnson/markdownlint/blob/main/README.md#optionsconfig
[markdownlint-configuration]: https://github.com/DavidAnson/markdownlint/blob/main/README.md#configuration
[markdownlint-custom-rules]: https://github.com/DavidAnson/markdownlint/blob/main/doc/CustomRules.md
[markdownlint-options]: https://github.com/DavidAnson/markdownlint/blob/main/README.md#options
[markdownlint-rules-aliases]: https://github.com/DavidAnson/markdownlint/blob/main/README.md#rules--aliases
[markdownlint-rules-tags]: https://github.com/DavidAnson/markdownlint/blob/main/README.md#tags
[markdownlint-cli]: https://github.com/igorshubovych/markdownlint-cli
[markdownlint-cli2]: https://github.com/DavidAnson/markdownlint-cli2
[markdownlint-cli2-formatter]: https://www.npmjs.com/search?q=keywords:markdownlint-cli2-formatter
[markdownlint-cli2-js]: test/markdownlint-cli2-js/.markdownlint-cli2.js
[markdownlint-cli2-jsonc]: test/markdownlint-cli2-jsonc-example/.markdownlint-cli2.jsonc
[markdownlint-cli2-yaml]: test/markdownlint-cli2-yaml-example/.markdownlint-cli2.yaml
[markdownlint-js]: test/markdownlint-js/.markdownlint.js
[markdownlint-jsonc]: test/markdownlint-jsonc/.markdownlint.jsonc
[markdownlint-yaml]: test/markdownlint-yaml/.markdownlint.yaml
[nodejs]: https://nodejs.org/
[nodejs-require]: https://nodejs.org/api/modules.html#modules_require_id
[npm-image]: https://img.shields.io/npm/v/markdownlint-cli2.svg
[npm-url]: https://www.npmjs.com/package/markdownlint-cli2
[regexp]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
[regexp-constructor]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/RegExp
[vscode]: https://code.visualstudio.com/
[vscode-markdownlint]: https://marketplace.visualstudio.com/items/DavidAnson.vscode-markdownlint
[yaml]: https://wikipedia.org/wiki/YAML
