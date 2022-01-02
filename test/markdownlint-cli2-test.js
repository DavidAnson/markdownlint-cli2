// @ts-check

"use strict";

const path = require("path");
const test = require("ava").default;
const { "main": markdownlintCli2 } = require("../markdownlint-cli2.js");
const FsMock = require("./fs-mock");

const outputFormatterLengthIs = (t, length) => (options) => {
  const { results } = options;
  t.is(Object.keys(results).length, length);
};

test("name and version", (t) => {
  t.plan(2);
  const packageJson = require("../package.json");
  const logMessage = (msg) => {
    const match = (/^(?<name>\S+)\sv(?<version>\S+)\s/u).exec(msg);
    if (match) {
      const { name, version } = match.groups;
      t.is(name, packageJson.name);
      t.is(version, packageJson.version);
    }
  };
  const logError = (msg) => t.fail(`message logged: ${msg}`);
  return markdownlintCli2({
    "argv": [],
    logMessage,
    logError
  });
});

test("README files", (t) => {
  t.plan(1);
  const uncalled = (msg) => t.fail(`message logged: ${msg}`);
  const argv = [
    "README.md",
    "./doc/OutputFormatters.md",
    "./formatter-default/README.md",
    "./formatter-json/README.md",
    "./formatter-junit/README.md",
    "./formatter-pretty/README.md",
    "./formatter-summarize/README.md"
  ];
  return markdownlintCli2({
    argv,
    "logError": uncalled,
    "optionsDefault": {
      "customRules": [ require("markdownlint-rule-github-internal-links") ]
    }
  }).
    then((exitCode) => t.is(exitCode, 0));
});

test("absolute path to directory glob", async (t) => {
  t.plan(1);
  const argv = [ path.resolve("./test/no-config") ];
  const exitCode = await markdownlintCli2({ argv });
  t.is(exitCode, 1);
});

test("main options default", (t) => {
  t.plan(2);
  const uncalled = (msg) => t.fail(`message logged: ${msg}`);
  return Promise.all([
    markdownlintCli2({
      "directory": "test/main-options-default",
      "argv": [ "*.md" ],
      "logError": uncalled,
      "optionsDefault": {
        "config": {
          "single-trailing-newline": false
        },
        "ignores": [ "viewme.md" ]
      }
    }),
    markdownlintCli2({
      "directory": "test/main-options-default",
      "argv": [ "info.md" ],
      "optionsDefault": {
        "customRules": [ require("./customRules/rules/first-line") ]
      }
    })
  ]).
    then((exitCodes) => {
      const [ exitCode0, exitCode1 ] = exitCodes;
      t.is(exitCode0, 0);
      t.is(exitCode1, 1);
    });
});

test("main options override", (t) => {
  t.plan(2);
  const uncalled = (msg) => t.fail(`message logged: ${msg}`);
  return markdownlintCli2({
    "directory": "test/main-options-override",
    "argv": [ "*.md" ],
    "logError": uncalled,
    "optionsOverride": {
      "config": {
        "no-trailing-spaces": false
      },
      "fix": false,
      "outputFormatters": [ [ outputFormatterLengthIs(t, 2) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("alternate file contents", (t) => {
  t.plan(2);
  const argv = [
    "README.md",
    "./doc/OutputFormatters.md",
    "./formatter-default/README.md",
    "./formatter-json/README.md",
    "./formatter-junit/README.md",
    "./formatter-pretty/README.md",
    "./formatter-summarize/README.md",
    "./test/all-ok/viewme.md",
    "./test/no-config/viewme.md",
    "./test/markdownlint-json/viewme.md",
    "./test/markdownlint-yaml/viewme.md"
  ];
  const fileContents = {
    "README.md": "# Heading",
    "./doc/OutputFormatters.md": "# Heading\n\n\tText.\n\n",
    "./test/all-ok/viewme.md": "# Heading",
    "./test/no-config/viewme.md": "# Heading\n",
    "./test/markdownlint-json/viewme.md": "# Heading",
    "./test/markdownlint-yaml/viewme.md": "# Heading\n"
  };
  const nonFileContents = {
    "untitled-1": "# Heading",
    "untitled-2": "# Heading\n",
    "untitled-3": ""
  };
  return markdownlintCli2({
    argv,
    fileContents,
    nonFileContents,
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 6) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("alternate file contents with ignores", (t) => {
  t.plan(2);
  const argv = [
    "./test/markdownlint-cli2-jsonc-example/viewme.md",
    "./test/markdownlint-cli2-yaml-example/viewme.md"
  ];
  const fileContents = {
    "./test/markdownlint-cli2-jsonc-example/viewme.md": "# Heading"
  };
  return markdownlintCli2({
    argv,
    fileContents,
    "optionsOverride": {
      "fix": false,
      "outputFormatters": [ [ outputFormatterLengthIs(t, 4) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, file, no changes", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": __dirname,
    "argv": [ ":./markdownlint-json/viewme.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 4) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, file, changes", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": __dirname,
    "argv": [ ":./markdownlint-json/viewme.md" ],
    "fileContents": {
      "./markdownlint-json/viewme.md": "# Title\n\n> Tagline \n\n\n"
    },
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 1) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, no file", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": __dirname,
    "argv": [],
    "nonFileContents": {
      "untitled-1": "# Title\n\nText\t\n"
    },
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 2) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, no file, empty", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": __dirname,
    "argv": [],
    "nonFileContents": {
      "untitled-1": ""
    },
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 0) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 0));
});

test("extension scenario, ignores handled", (t) => {
  t.plan(2);
  const fileContents = {
    "viewme.md": "Heading",
    "ignoreme.md": "Heading\n",
    "dir/viewme.md": "Heading",
    "dir/ignoreme.md": "Heading\n",
    "dir/subdir/viewme.md": "Heading",
    "dir/subdir/ignoreme.md": "Heading\n"
  };
  const argv = Object.keys(fileContents).map((key) => `:${key}`);
  return markdownlintCli2({
    "directory": path.join(__dirname, "extension-scenario-ignores"),
    argv,
    fileContents,
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 6) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, ignores handled, absolute paths", (t) => {
  t.plan(2);
  const directory = path.join(__dirname, "extension-scenario-ignores");
  const fileContents = Object.fromEntries(
    Object.entries({
      "viewme.md": "Heading",
      "ignoreme.md": "Heading\n",
      "dir/viewme.md": "Heading",
      "dir/ignoreme.md": "Heading\n",
      "dir/subdir/viewme.md": "Heading",
      "dir/subdir/ignoreme.md": "Heading\n"
    }).map((entry) => [
      path.resolve(directory, entry[0]),
      entry[1]
    ])
  );
  const argv = Object.keys(fileContents).map((key) => `:${key}`);
  return markdownlintCli2({
    directory,
    argv,
    fileContents,
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 6) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, globs ignored/filtered", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": path.join(__dirname, "extension-scenario-globs"),
    "argv": [
      ":viewme.md",
      ":dir/viewme.md",
      ":dir/subdir/viewme.md",
      ":dir2/viewme.md"
    ],
    "fileContents": {
      "viewme.md": "Heading",
      "dir/viewme.md": "Heading",
      "dir/subdir/viewme.md": "Heading",
      "dir2/viewme.md": "Heading"
    },
    "noGlobs": true,
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 4) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("backslash translation", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": __dirname,
    "argv": [
      "./markdownlint-json/viewme.md",
      "markdownlint-jsonc/viewme.md",
      path.join(__dirname, "markdownlint-cli2-jsonc/viewme.md"),
      ".\\markdownlint-yml\\viewme.md",
      "markdownlint-yaml\\viewme.md",
      path.join(__dirname, "markdownlint-cli2-yaml\\viewme.md")
    ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 24) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("custom fs, extension scenario for untitled", (t) => {
  t.plan(4);
  let accessCalls = 0;
  const access = (file) => {
    accessCalls++;
    return (path.basename(file) === ".markdownlint-cli2.jsonc")
      ? Promise.resolve()
      : Promise.reject(new Error("No access"));
  };
  const readFile = (file) => {
    t.is(path.basename(file), ".markdownlint-cli2.jsonc");
    return Promise.resolve(JSON.stringify({
      "config": {
        "first-line-heading": false
      }
    }));
  };
  const writeFile = () => {
    t.fail("writeFile called");
  };
  return markdownlintCli2({
    "nonFileContents": {
      "name": "Text"
    },
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 1) ] ]
    },
    "fs": {
      "promises": {
        access,
        readFile,
        writeFile
      }
    },
    "noRequire": true
  }).
    then((exitCode) => {
      t.is(exitCode, 1);
      t.is(accessCalls, 5);
    });
});

test("custom fs, extension scenario with exception", (t) => {
  t.plan(1);
  return markdownlintCli2({
    "argv": [ "unused" ],
    "fs": {
      "promises": {
        "access": () => Promise.reject(new Error("No access")),
        "stat": () => Promise.reject(new Error("No stat"))
      },
      "access": null,
      "lstat": null,
      "stat": null,
      "readdir": null,
      "readFile": null
    },
    "noErrors": true
  }).
    then((exitCode) => {
      t.is(exitCode, 0);
    });
});

test("custom fs, file and path including/escaping ':'", (t) => {
  t.plan(7);
  return markdownlintCli2({
    "directory": "/custom",
    "argv": [
      "normal.md",
      ":literal.md",
      "\\:escaped.md",
      "path/normal.md",
      ":path/literal.md",
      "\\:path/escaped.md"
    ],
    "fs": {
      "promises": {
        "access": () => Promise.reject(new Error("No access")),
        "stat": () => Promise.reject(new Error("No stat"))
      },
      "lstat": (p, o, cb) => {
        const stats = {
          "isBlockDevice": () => false,
          "isCharacterDevice": () => false,
          "isDirectory": () => false,
          "isFIFO": () => false,
          "isFile": () => true,
          "isSocket": () => false,
          "isSymbolicLink": () => false
        };
        return (cb || o)(null, stats);
      },
      "readFile": (p, o, cb) => {
        const normalized = p.replace(/^[^/]*/u, "");
        t.true(
          [
            "/custom/normal.md",
            "/custom/literal.md",
            "/custom/:escaped.md",
            "/custom/path/normal.md",
            "/custom/path/literal.md",
            "/custom/:path/escaped.md"
          ].includes(normalized),
          normalized
        );
        return (cb || o)(null, "# Heading\n");
      }
    }
  }).
    then((exitCode) => {
      t.is(exitCode, 0);
    });
});

test("custom fs, using node:fs", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": "test/markdownlint-cli2-jsonc",
    "argv": [ "**/*.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 9) ] ]
    },
    "fs": require("fs")
  }).
    then((exitCode) => {
      t.is(exitCode, 1);
    });
});

test("custom fs, using node:fs and noRequire=false", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": "test/markdownlint-js",
    "argv": [ "**/*.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 10) ] ]
    },
    "fs": require("fs"),
    "noRequire": false
  }).
    then((exitCode) => {
      t.is(exitCode, 1);
    });
});

test("custom fs, using node:fs and noRequire=true", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": "test/markdownlint-js",
    "argv": [ "**/*.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 13) ] ]
    },
    "fs": require("fs"),
    "noRequire": true
  }).
    then((exitCode) => {
      t.is(exitCode, 1);
    });
});

test("custom fs, using fsMock", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": "/mock",
    "argv": [ "**/*.md", "viewme.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 9) ] ]
    },
    "fs": new FsMock(path.join(__dirname, "markdownlint-cli2-jsonc")),
    "noRequire": true
  }).
    then((exitCode) => {
      t.is(exitCode, 1);
    });
});

test("custom fs, using fsMock simulating symbolic links", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": "/mock",
    "argv": [ "**/*.md", "viewme.md" ],
    "optionsOverride": {
      "outputFormatters": [ [ outputFormatterLengthIs(t, 9) ] ]
    },
    "fs": new FsMock(path.join(__dirname, "markdownlint-cli2-jsonc"), true),
    "noRequire": true
  }).
    then((exitCode) => {
      t.is(exitCode, 1);
    });
});
