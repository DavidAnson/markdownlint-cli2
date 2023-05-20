# Contributing

Interested in contributing? Great! Here are some suggestions to make it a good
experience:

Start by [opening an issue][github-issues], whether to identify a problem or
suggest a change. That issue should be used to discuss the situation and agree
on a plan of action before writing code or sending a pull request. Maybe the
problem isn't really a problem, or maybe there are other things to consider. If
so, it's best to realize that before spending time and effort writing code that
may not get used.

Match the coding style of the files you edit. Although everyone has their own
preferences and opinions, a pull request is not the right forum to debate them.

Package versions for `dependencies` and `devDependencies` should be specified
exactly (also known as "pinning"). The short explanation is that doing otherwise
eventually leads to inconsistent behavior and broken functionality. (See [Pin
your npm/yarn dependencies][pin-dependencies] for a longer explanation.)

Add tests for all new/changed functionality. Test positive and negative
scenarios. Try to break the code now, or else it will get broken later.

Run tests via `npm test`. Lint by running `npm run lint`. Run the continuous
integration suite via `npm run ci`. CI tests must pass on all platforms with
100% code coverage.

Pull requests should contain a single commit that addresses a single issue.

Open pull requests against the `next` branch. Include the text "(fixes #??)." at
the end of the commit message so it will be associated with the corresponding
issue. Once merged, the tag `fixed in next` will be added to the issue. When the
commit is merged to the `main` branch during the release process, the issue will
get closed automatically. (See [the GitHub documentation][linking-pull-request]
for details.)

Please refrain from using slang or meaningless placeholder words. Sample content
can be "text", "code", "heading", or the like. Sample URLs should use
[example.com][example-com] which is safe for this purpose. Profanity is not
allowed.

In order to maintain the permissive MIT license this project uses, all
contributions must be your own and released under that license. Code you add
should be an original work and should not be copied from elsewhere. Taking code
from a different project, Stack Overflow, or the like is not allowed. The use
of tools such as GitHub Copilot that generate code from other projects is not
allowed.

Thank you!

[example-com]: https://en.wikipedia.org/wiki/Example.com
[github-issues]: https://github.com/DavidAnson/markdownlint-cli2/issues
[linking-pull-request]: https://docs.github.com/en/github/managing-your-work-on-github/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword
[pin-dependencies]: https://maxleiter.com/blog/pin-dependencies
