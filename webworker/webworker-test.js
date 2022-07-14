"use strict";

const oneViolation = "# Title\n\nText \n";
const twoViolations = "# Title\n\nText\t\n";
const noViolationsIgnoringTabs = "# Title\n\n\tText\n";
const configNoHardTabs = "{\n\"no-hard-tabs\": false\n}";

const files = [
  [ "/file.md", twoViolations ],
  [ "/dir1/file.md", twoViolations ],
  [ "/dir1/.markdownlint.json", configNoHardTabs ],
  [ "/dir2/file.md", twoViolations ],
  [ "/dir2/.markdownlint-cli2.jsonc", `{\n"config":${configNoHardTabs}\n}` ],
  [ "/dir3/file.md", twoViolations ],
  [ "/dir3/.markdownlint.json", "{\n\"extends\": \"./extended.json\"\n}" ],
  [ "/dir3/extended.json", configNoHardTabs ],
  [ "/dir4/file.md", oneViolation ]
];

const outputFormatterLengthIs = (assert, length) => (options) => {
  const { results } = options;
  assert.equal(Object.keys(results).length, length);
};

/* eslint-disable no-undef */

QUnit.test("script loads", (assert) => {
  assert.expect(1);
  assert.ok(markdownlintCli2);
});

QUnit.test("empty call to main()", (assert) => {
  assert.expect(1);
  assert.ok(markdownlintCli2.main({
    "fs": new FsVirtual(files)
  }));
});

QUnit.test("unsaved", (assert) => {
  assert.expect(1);
  return markdownlintCli2.main({
    "fs": new FsVirtual(files),
    "argv": [],
    "nonFileContents": {
      "untitled-1": twoViolations
    },
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(assert, 2) ] ]
    }
  });
});

QUnit.test("unsaved, empty", (assert) => {
  assert.expect(1);
  return markdownlintCli2.main({
    "fs": new FsVirtual(files),
    "argv": [],
    "nonFileContents": {
      "untitled-1": ""
    },
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(assert, 0) ] ]
    }
  });
});

QUnit.test("file, no configuration", (assert) => {
  assert.expect(1);
  return markdownlintCli2.main({
    "fs": new FsVirtual(files),
    "argv": [ ":/file.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(assert, 2) ] ]
    }
  });
});

QUnit.test("file, no configuration, edits", (assert) => {
  assert.expect(1);
  return markdownlintCli2.main({
    "fs": new FsVirtual(files),
    "argv": [ ":/file.md" ],
    "fileContents": {
      "/file.md": oneViolation
    },
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(assert, 1) ] ]
    }
  });
});

QUnit.test("file, .markdownlint.json", (assert) => {
  assert.expect(1);
  return markdownlintCli2.main({
    "fs": new FsVirtual(files),
    "argv": [ ":/dir1/file.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(assert, 1) ] ]
    }
  });
});

QUnit.test("file, .markdownlint.json, edits", (assert) => {
  assert.expect(1);
  return markdownlintCli2.main({
    "fs": new FsVirtual(files),
    "argv": [ ":/dir1/file.md" ],
    "fileContents": {
      "/dir1/file.md": noViolationsIgnoringTabs
    },
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(assert, 0) ] ]
    }
  });
});

QUnit.test("file, .markdownlint.json, extends", (assert) => {
  assert.expect(1);
  return markdownlintCli2.main({
    "fs": new FsVirtual(files),
    "argv": [ ":/dir3/file.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(assert, 1) ] ]
    }
  });
});

QUnit.test("file, .markdownlint-cli2.jsonc", (assert) => {
  assert.expect(1);
  return markdownlintCli2.main({
    "fs": new FsVirtual(files),
    "argv": [ ":/dir2/file.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(assert, 1) ] ]
    }
  });
});

QUnit.test("file, fix", (assert) => {
  assert.expect(3);
  const fsVirtual = new FsVirtual(files);
  return markdownlintCli2.main({
    "fs": fsVirtual,
    "argv": [ ":/dir4/file.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(assert, 1) ] ]
    }
  }).
    then(() => markdownlintCli2.main({
      "fs": fsVirtual,
      "argv": [ ":/dir4/file.md" ],
      "optionsOverride": {
        "fix": true,
        "outputFormatters": [ [ outputFormatterLengthIs(assert, 0) ] ]
      }
    })).
    then(() => markdownlintCli2.main({
      "fs": fsVirtual,
      "argv": [ ":/dir4/file.md" ],
      "optionsOverride": {
        "outputFormatters": [ [ outputFormatterLengthIs(assert, 0) ] ]
      }
    }));
});

QUnit.test("workspace", (assert) => {
  assert.expect(1);
  return markdownlintCli2.main({
    "fs": new FsVirtual(files),
    "argv": [ "**/*.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(assert, 6) ] ]
    }
  });
});
