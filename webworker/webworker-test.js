"use strict";

/* globals markdownlintCli2, FsVirtual, QUnit */

const md009 = "# Title\n\nText \n";
const md010 = "# Title\n\n\tText\n";
const md009md010 = "# Title\n\nText\t\n";
const md047 = "# Title\n\nText";
const configNoMd010 = "{\n\"no-hard-tabs\": false\n}";
const configNoMd047 = "{\n\"single-trailing-newline\": false\n}";

const files = [
  [ "/file.md", md009md010 ],
  [ "/file-two.md", md047 ],
  [ "/.gitignore", "dir*" ],
  [ "/package.json", `{\n"markdownlint-cli2": {\n"config": ${configNoMd047},\n"customRules": [],\n"markdownItPlugins": []\n}\n}` ],
  [ "/dir1/file.md", md009md010 ],
  [ "/dir1/.markdownlint.json", configNoMd010 ],
  [ "/dir2/file.md", md009md010 ],
  [ "/dir2/.markdownlint-cli2.jsonc", `{\n"config":${configNoMd010}\n}` ],
  [ "/dir3/file.md", md009md010 ],
  [ "/dir3/.markdownlint.json", "{\n\"extends\": \"./extended.json\"\n}" ],
  [ "/dir3/extended.json", configNoMd010 ],
  [ "/dir4/file.md", md009 ],
  [ "/dir5/file.md", md009md010 ],
  [ "/dir5/.markdownlint-cli2.yaml", `config:\n  extends: ./extended.json\n` ],
  [ "/dir5/extended.json", configNoMd010 ],
  [ "/dir6/skip.md", md009md010 ],
  [ "/dir6/.markdownlint-cli2.jsonc", `{\n"ignores":["skip.md"]\n}` ]
];

const outputFormatterLengthIs = (assert, length) => (options) => {
  const { results } = options;
  assert.equal(Object.keys(results).length, length);
};

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
      "untitled-1": md009md010
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
      "/file.md": md009
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
      "/dir1/file.md": md010
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
      "outputFormatters": [ [ outputFormatterLengthIs(assert, 7) ] ]
    }
  });
});

QUnit.test("workspace, gitignore (unsupported)", (assert) => {
  assert.expect(1);
  const filesWithGitignore = [
    ...files,
    [ "/.markdownlint-cli2.jsonc", `{\n"gitignore":true\n}` ]
  ];
  return markdownlintCli2.main({
    "fs": new FsVirtual(filesWithGitignore),
    "argv": [ "**/*.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(assert, 8) ] ]
    }
  });
});
