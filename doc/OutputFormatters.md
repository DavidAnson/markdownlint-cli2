# Output Formatters

`markdownlint-cli2` lets you customize its output by specifying one or more
output formatters in its [configuration file][configuration-file]. Output
formatters can be defined by scripts within a project or imported from a package
([keyword `markdownlint-cli2-formatter` on npm][markdownlint-cli2-formatter]).

## Authoring

Output formatters are called after linting is done and are passed arguments that
include the results, logging functions, and formatter parameters. They are
expected to return a `Promise` that resolves when output formatting is complete
or `void` if execution completes synchronously.

Output formatters export a function like:

```javascript
module.exports = (options, params) => { ... }
```

Where `options` is an object that looks like:

- `results`: `Array` of [`markdownlint` `LintError` objects][markdownlint-d-ts]
  - [Example `results` object][output-formatters-json]
- `logMessage`: `Function` that takes a single `String` argument and logs it to
  standard output
- `logError`: `Function` that takes a single `String` argument and logs it to
  standard error

And `params` is an object containing formatter parameters from configuration.

For a `.markdownlint-cli2.jsonc` like:

```json
{
  "outputFormatters": [
    [ "markdownlint-cli2-formatter-json", { "name": "custom-name.json", "spaces": 1 } ]
  ]
}
```

`params` would be:

```json
{
  "name": "custom-name.json",
  "spaces": 1
}
```

## Examples

- [Default formatter][formatter-default]
- [Code Quality formatter][formatter-codequality]
- [JUnit formatter][formatter-junit]

<!-- markdownlint-disable line-length -->

[configuration-file]: https://github.com/DavidAnson/markdownlint-cli2#configuration
[formatter-default]: ../formatter-default/markdownlint-cli2-formatter-default.js
[formatter-codequality]: ../formatter-codequality/markdownlint-cli2-formatter-codequality.js
[formatter-junit]: ../formatter-junit/markdownlint-cli2-formatter-junit.js
[markdownlint-cli2-formatter]: https://www.npmjs.com/search?q=keywords:markdownlint-cli2-formatter
[markdownlint-d-ts]: https://github.com/DavidAnson/markdownlint/blob/main/lib/markdownlint.d.ts
[output-formatters-json]: ../test/outputFormatters.formatter.json
