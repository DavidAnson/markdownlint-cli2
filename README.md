# markdownlint-cli2

> A fast, flexible, configuration-based command-line interface for linting
> Markdown/CommonMark files with the `markdownlint` library

[![npm version][npm-image]][npm-url]
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

Or [use the container image](#container-image) available on
[Docker Hub as davidanson/markdownlint-cli2][docker-hub-markdownlint-cli2].

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
- More about the [motivation for `markdownlint-cli2`][markdownlint-cli2-blog].

## Use

### Command Line

```text
markdownlint-cli2 vX.Y.Z (markdownlint vX.Y.Z)
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
- UNIX and Windows shells expand globs according to different rules; quoting arguments is recommended
- Some Windows shells don't handle single-quoted (') arguments well; double-quote (") is recommended
- Shells that expand globs do not support negated patterns (!node_modules); quoting is required here
- Some UNIX shells parse exclamation (!) in double-quotes; hashtag (#) is recommended in these cases
- The path separator is forward slash (/) on all platforms; backslash (\) is automatically converted

Therefore, the most compatible glob syntax for cross-platform support:
$ markdownlint-cli2 "**/*.md" "#node_modules"
```

For scenarios where it is preferable to specify glob expressions in a
configuration file, the `globs` property of `.markdownlint-cli2.jsonc` or
`.markdownlint-cli2.yaml` or `.markdownlint-cli2.js` may be used instead of (or
in addition to) passing `glob0 ... globN` on the command-line.

As shown above, the default command-line for `markdownlint-cli2` looks something
like:

```bash
markdownlint-cli2 "**/*.md" "#node_modules"
```

However, because sharing configuration between "normal" and "fix" modes is so
common, the following command defaults the `fix` property (see below) to `true`:

```bash
markdownlint-cli2-fix "**/*.md" "#node_modules"
```

Other than the default behavior of the `fix` property (which can be overridden
in both cases), these two commands behave identically.

### Container Image

A container image [`davidanson/markdownlint-cli2`][docker-hub-markdownlint-cli2]
can also be used (e.g., as part of a CI pipeline):

```bash
docker run -v $PWD:/workdir davidanson/markdownlint-cli2:0.3.0 "**/*.md" "#node_modules"
```

Notes:

- As when using the [command line](#command-line), glob patterns are passed as
  arguments.
- By default, `markdownlint-cli2` will execute within the `/workdir` directory
  _inside the container_. So, as shown above, [bind mount][docker-bind-mounts]
  the project's directory there.
  - A custom working directory can be specified with Docker's `-w` flag:

    ```bash
    docker run -w /myfolder -v $PWD:/myfolder davidanson/markdownlint-cli2:0.3.0 "**/*.md" "#node_modules"
    ```

To invoke the `markdownlint-cli2-fix` command instead, specify it via Docker's
`--entrypoint` flag:

```bash
docker run -v $PWD:/workdir --entrypoint="markdownlint-cli2-fix" davidanson/markdownlint-cli2:0.3.0 "**/*.md" "#node_modules"
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
- In general, glob expressions match files under the current directory and
  configuration for that (top-level) directory applies to the entire tree
  - When glob expressions match files *not* under the current directory,
    configuration for the current (top-level) directory is applied to the
    closest common parent directory

### `.markdownlint-cli2.jsonc`

- The format of this file is a [JSONC][jsonc] object similar to the
  [`markdownlint` `options` object][markdownlint-options].
- Valid properties are:
  - `config`: [`markdownlint` `config` object][markdownlint-config] to configure
    rules for this part of the directory tree
    - If a `.markdownlint.{jsonc,json,yaml,yml,js}` file (see below) is present
      in the same directory, it overrides the value of this property
  - `customRules`: `Array` of `String`s (or `Array`s of `String`s) of module
    names/paths of [custom rules][markdownlint-custom-rules] to load and use
    when linting
    - Each `String` is passed as the `id` parameter to Node's
      [require function][nodejs-require]
    - Relative paths are resolved based on the location of the `JSONC` file
    - Search [`markdownlint-rule` on npm][markdownlint-rule]
  - `fix`: `Boolean` value to enable fixing of linting errors reported by rules
    that emit fix information
    - Fixes are made directly to the relevant file(s); no backup is created
  - `frontMatter`: `String` defining the [`RegExp`][regexp] used to match and
    ignore any [front matter][front-matter] at the beginning of a document
    - The `String` is passed as the `pattern` parameter to the
      [`RegExp` constructor][regexp-constructor]
    - For example: `(^---\s*$[^]*?^---\s*$)(\r\n|\r|\n|$)`
  - `globs`: `Array` of `String`s defining glob expressions to append to the
    command-line arguments
    - This setting can be used instead of (or in addition to) passing globs on
      the command-line and offers identical performance
    - This top-level setting is valid **only** in the directory from which
      `markdownlint-cli2` is run
  - `ignores`: `Array` of `String`s defining glob expressions to ignore when
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
    naming a [markdown-it plugin][markdown-it-syntax-extensions] followed by
    parameters
    - Plugins can be used to add support for additional Markdown syntax
    - Relative paths are resolved based on the location of the `JSONC` file
    - For example: `[ [ "plugin-name", param_0, param_1, ... ], ... ]`
    - Search [`markdown-it-plugins` on npm][markdown-it-plugins]
  - `noInlineConfig`: `Boolean` value to disable the support of
    [HTML comments][html-comment] within Markdown content
    - For example: `<!-- markdownlint-disable some-rule -->`
  - `noProgress`: `Boolean` value to disable the display of progress on `stdout`
    - This top-level setting is valid **only** in the directory from which
      `markdownlint-cli2` is run
  - `outputFormatters`: `Array` of `Array`s, each of which has a `String`
    naming an [output formatter][output-formatters] followed by parameters
    - Formatters can be used to customize the tool's output for different
      scenarios
    - Relative paths are resolved based on the location of the `JSONC` file
    - For example: `[ [ "formatter-name", param_0, param_1, ... ], ... ]`
    - This top-level setting is valid **only** in the directory from which
      `markdownlint-cli2` is run
    - Search [`markdownlint-cli2-formatter` on npm][markdownlint-cli2-formatter]
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
- Instead of passing a `String` to identify the module name/path to load for
  `customRules`, `markdownItPlugins`, and `outputFormatters`, the corresponding
  `Object` or `Function` can be provided directly.
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

- `.markdownlintignore` is not supported.

## pre-commit

To run `markdownlint-cli2` as part of a [pre-commit][pre-commit] workflow, add a
reference to the `repos` list in that project's `.pre-commit-config.yaml` like:

```yaml
- repo: https://github.com/DavidAnson/markdownlint-cli2
  rev: v0.3.0
  hooks:
  - id: markdownlint-cli2
```

> Depending on the environment that workflow runs in, it may be necessary to
> [override the version of Node.js used by pre-commit][pre-commit-version].

## History

- 0.0.2 - Initial release
- 0.0.3 - Feature parity with `markdownlint-cli`
- 0.0.4 - Support output formatters and `markdown-it` plugins
- 0.0.5 - Improve support for ignoring files
- 0.0.6 - Improve handling of very large directory trees
- 0.0.7 - Support `.markdownlint-cli2.js` and `.markdownlint.js`
- 0.0.8 - Support `.markdownlint-cli2.yaml`, add progress
- 0.0.9 - Improve configuration file handling
- 0.0.10 - Improve performance and configuration
- 0.0.11 - Improve performance of `fix`, update banner
- 0.0.12 - Update dependencies (including `markdownlint`)
- 0.0.13 - Add `markdownlint-cli2-fix` command
- 0.0.14 - Update dependencies (including `markdownlint`)
- 0.0.15 - Improve extensibility
- 0.1.0 - Simplify use of `require`, increment minor version
  - 0.1.1 - Restore previous use of `require`
  - 0.1.2 - Update use of `require` to be more flexible
  - 0.1.3 - Support rule collections
- 0.2.0 - Improve handling of Windows paths using backslash
- 0.3.0 - Add Docker container, update dependencies

<!-- markdownlint-disable line-length -->

[commonmark]: https://commonmark.org/
[commonjs-module]: https://nodejs.org/api/modules.html#modules_modules_commonjs_modules
[docker-bind-mounts]: https://docs.docker.com/storage/bind-mounts/
[docker-hub-markdownlint-cli2]: https://hub.docker.com/r/davidanson/markdownlint-cli2
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
[markdown-it-syntax-extensions]: https://github.com/markdown-it/markdown-it#syntax-extensions
[markdownlint]: https://github.com/DavidAnson/markdownlint
[markdownlint-config]: https://github.com/DavidAnson/markdownlint/blob/main/README.md#optionsconfig
[markdownlint-configuration]: https://github.com/DavidAnson/markdownlint/blob/main/README.md#configuration
[markdownlint-custom-rules]: https://github.com/DavidAnson/markdownlint/blob/main/doc/CustomRules.md
[markdownlint-options]: https://github.com/DavidAnson/markdownlint/blob/main/README.md#options
[markdownlint-rules-aliases]: https://github.com/DavidAnson/markdownlint/blob/main/README.md#rules--aliases
[markdownlint-rules-tags]: https://github.com/DavidAnson/markdownlint/blob/main/README.md#tags
[markdownlint-cli]: https://github.com/igorshubovych/markdownlint-cli
[markdownlint-cli2]: https://github.com/DavidAnson/markdownlint-cli2
[markdownlint-cli2-blog]: https://dlaa.me/blog/post/markdownlintcli2
[markdownlint-cli2-formatter]: https://www.npmjs.com/search?q=keywords:markdownlint-cli2-formatter
[markdownlint-cli2-js]: test/markdownlint-cli2-js/.markdownlint-cli2.js
[markdownlint-cli2-jsonc]: test/markdownlint-cli2-jsonc-example/.markdownlint-cli2.jsonc
[markdownlint-cli2-yaml]: test/markdownlint-cli2-yaml-example/.markdownlint-cli2.yaml
[markdownlint-js]: test/markdownlint-js/.markdownlint.js
[markdownlint-jsonc]: https://github.com/DavidAnson/markdownlint/blob/main/schema/.markdownlint.jsonc
[markdownlint-rule]: https://www.npmjs.com/search?q=keywords:markdownlint-rule
[markdownlint-yaml]: https://github.com/DavidAnson/markdownlint/blob/main/schema/.markdownlint.yaml
[nodejs]: https://nodejs.org/
[nodejs-require]: https://nodejs.org/api/modules.html#modules_require_id
[npm-image]: https://img.shields.io/npm/v/markdownlint-cli2.svg
[npm-url]: https://www.npmjs.com/package/markdownlint-cli2
[output-formatters]: doc/OutputFormatters.md
[pre-commit]: https://pre-commit.com/
[pre-commit-version]: https://pre-commit.com/#overriding-language-version
[regexp]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
[regexp-constructor]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/RegExp
[vscode]: https://code.visualstudio.com/
[vscode-markdownlint]: https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint
[yaml]: https://wikipedia.org/wiki/YAML
