# markdownlint-cli2-formatter-template

> An output formatter for [`markdownlint-cli2`][markdownlint-cli2] that displays
> results using a template

[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]

## Install

```bash
npm install markdownlint-cli2-formatter-template --save-dev
```

## Use

This output formatter makes it easy to custom-format linting violations. To
specify an output format, set the `template` parameter to a `string` with text
and one or more tokens representing any of the following elements. The specified
template will be applied once for each violation.

These tokens are always defined:

| Token             | Meaning               |
|-------------------|-----------------------|
| `fileName`        | File name             |
| `lineNumber`      | Line number (1-based) |
| `ruleName`        | Rule name (full)      |
| `ruleDescription` | Rule description      |
| `ruleInformation` | Informational URL     |

These tokens are sometimes defined (depending on the rule/violation):

| Token           | Meaning                  |
|-----------------|--------------------------|
| `columnNumber`  | Column number (1-based)  |
| `errorContext`  | Context information      |
| `errorDetail`   | Additional detail        |
| `errorSeverity` | Severity (error/warning) |

In the simplest case, tokens are specified with the syntax `${token}`. This is
all that's needed for tokens that are always defined. To support scenarios where
a token may not be defined, the syntaxes `${token:text if present}` and
`${token!text if not present}` are also supported. This allows for templates to
accommodate missing data. Only one level of token nesting is supported.

A few examples demonstrate the concept:

<!-- markdownlint-disable line-length -->

| Template                                                                 | Output if defined | Output if not defined |
|--------------------------------------------------------------------------|-------------------|-----------------------|
| `Column=${columnNumber}`                                                 | `Column=10`       | `Column=`             |
| `${columnNumber:Column=${columnNumber}}`                                 | `Column=10`       |                       |
| `${columnNumber!No column number}`                                       |                   | `No column number`    |
| `${columnNumber:Column=${columnNumber}}${columnNumber!No column number}` | `Column=10`       | `No column number`    |

<!-- markdownlint-restore -->

## Examples

To output in the [GitHub Actions workflow commands format][workflow-commands],
use something like the following `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [
      "markdownlint-cli2-formatter-template",
      {
        "template": "::${errorSeverity:${errorSeverity}}${errorSeverity!error} file=${fileName},line=${lineNumber},${columnNumber:col=${columnNumber},}title=${ruleName}::${ruleDescription}"
      }
    ]
  ]
}
```

Which produces output like:

```text
::error file=viewme.md,line=3,col=10,title=MD009/no-trailing-spaces::Trailing spaces
::warning file=viewme.md,line=5,title=MD012/no-multiple-blanks::Multiple consecutive blank lines
::error file=viewme.md,line=6,title=MD025/single-title/single-h1::Multiple top-level headings in the same document
::error file=viewme.md,line=12,col=4,title=MD019/no-multiple-space-atx::Multiple spaces after hash on atx style heading
::warning file=viewme.md,line=14,col=14,title=MD047/single-trailing-newline::Files should end with a single newline character
```

To output in the [Azure Pipelines Task command LogIssue format][task-logissue],
use something like the following `.markdownlint-cli2.jsonc`:

```json
{
  "outputFormatters": [
    [
      "markdownlint-cli2-formatter-template",
      {
        "template": "##vso[task.logissue type=${errorSeverity:${errorSeverity}}${errorSeverity!error};sourcepath=${fileName};linenumber=${lineNumber};${columnNumber:columnumber=${columnNumber};}code=${ruleName}]${ruleDescription}"
      }
    ]
  ]
}
```

Which produces output like:

```text
##vso[task.logissue type=error;sourcepath=viewme.md;linenumber=3;columnumber=10;code=MD009/no-trailing-spaces]Trailing spaces
##vso[task.logissue type=warning;sourcepath=viewme.md;linenumber=5;code=MD012/no-multiple-blanks]Multiple consecutive blank lines
##vso[task.logissue type=error;sourcepath=viewme.md;linenumber=6;code=MD025/single-title/single-h1]Multiple top-level headings in the same document
##vso[task.logissue type=error;sourcepath=viewme.md;linenumber=12;columnumber=4;code=MD019/no-multiple-space-atx]Multiple spaces after hash on atx style heading
##vso[task.logissue type=warning;sourcepath=viewme.md;linenumber=14;columnumber=14;code=MD047/single-trailing-newline]Files should end with a single newline character
```

[license-image]: https://img.shields.io/npm/l/markdownlint-cli2-formatter-template.svg
[license-url]: https://opensource.org/licenses/MIT
[markdownlint-cli2]: https://github.com/DavidAnson/markdownlint-cli2
[npm-image]: https://img.shields.io/npm/v/markdownlint-cli2-formatter-template.svg
[npm-url]: https://www.npmjs.com/package/markdownlint-cli2-formatter-template
[task-logissue]: https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops&tabs=bash#logissue-log-an-error-or-warning
[workflow-commands]: https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/workflow-commands-for-github-actions
