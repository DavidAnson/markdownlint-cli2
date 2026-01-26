// @ts-check

import nodeFs from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import Ajv from "ajv";
import test from "ava";
import * as globby from "globby";
import { __dirname, importWithTypeJson } from "./esm-helpers.mjs";
const packageJson = await importWithTypeJson(import.meta, "../package.json");
import { "main" as markdownlintCli2 } from "../markdownlint-cli2.mjs";
import jsoncParse from "../parsers/jsonc-parse.mjs";
import yamlParse from "../parsers/yaml-parse.mjs";
import FsVirtual from "../webworker/fs-virtual.cjs";
import firstLine from "./customRules/rules/first-line.cjs";

const schemaIdVersionRe = /^.*v(?<version>\d+\.\d+\.\d+).*$/u;
const markdownlintConfigSchemaDefinition = await importWithTypeJson(import.meta, "../schema/markdownlint-config-schema.json");
const markdownlintCli2ConfigSchemaDefinition = await importWithTypeJson(import.meta, "../schema/markdownlint-cli2-config-schema.json");

const outputFormatterLengthIs = (/** @type {import("ava").ExecutionContext<unknown>} */ t, /** @type {number} */ length) => (/** @type {import("../markdownlint-cli2.mjs").OutputFormatterOptions} */ options) => {
  const { results } = options;
  t.is(Object.keys(results).length, length, JSON.stringify(results, null, 2));
};

test("name and version", (t) => {
  t.plan(3);
  const logMessage = (/** @type {string} */ msg) => {
    const match = (/^(?<name>\S+)\sv(?<version>\S+)\s/u).exec(msg);
    if (match) {
      // @ts-ignore
      const { name, version } = match.groups;
      t.is(name, packageJson.name);
      t.is(version, packageJson.version);
    }
  };
  const logError = (/** @type {string} */ msg) => t.fail(`message logged: ${msg}`);
  return markdownlintCli2({
    "argv": [],
    logMessage,
    logError
  }).
    then((exitCode) => t.is(exitCode, 2));
});

test("version numbers match", async (t) => {
  t.plan(142);
  const files = [
    // See previous test
    // "./package.json",
    "./.pre-commit-hooks.yaml",
    "./CHANGELOG.md",
    "./README.md",
    "./doc/OutputFormatters.md",
    "./schema/markdownlint-cli2-config-schema.json",
    "./schema/markdownlint-config-schema.json"
  ];
  const packages = [
    // eslint-disable-next-line prefer-named-capture-group
    [ packageJson.version, /(?:DavidAnson\/markdownlint-cli2\/|markdownlint-cli2\/blob\/|davidanson\/markdownlint-cli2(?:-rules)?:|rev: )v(\d+\.\d+\.\d+)/gu ],
    // eslint-disable-next-line prefer-named-capture-group
    [ packageJson.dependencies.markdownlint, /(?:DavidAnson\/markdownlint|markdownlint\/blob)\/v(\d+\.\d+\.\d+)/gu ]
  ];
  const contents = await Promise.all(files.map((file) => fs.readFile(file, "utf8")));
  for (const content of contents) {
    // eslint-disable-next-line init-declarations
    let match;
    for (const [ version, githubProjectOrFileRe ] of packages) {
      while ((match = githubProjectOrFileRe.exec(content)) !== null) {
        t.is(match[1], version);
      }
    }
    // eslint-disable-next-line prefer-named-capture-group
    const firstChangelogRe = /## (\d+\.\d+\.\d+)/u;
    match = firstChangelogRe.exec(content);
    if (match) {
      t.is(match[1], packageJson.version);
    }
  }
});

test("README files", (t) => {
  t.plan(1);
  const uncalled = (/** @type {string} */ msg) => t.fail(`message logged: ${msg}`);
  const argv = [
    "CHANGELOG.md",
    "README.md",
    "./doc/OutputFormatters.md",
    "./formatter-default/README.md",
    "./formatter-codequality/README.md",
    "./formatter-json/README.md",
    "./formatter-junit/README.md",
    "./formatter-pretty/README.md",
    "./formatter-sarif/README.md",
    "./formatter-summarize/README.md",
    "./formatter-template/README.md",
    "./schema/ValidatingConfiguration.md"
  ];
  return markdownlintCli2({
    argv,
    "logError": uncalled
  }).
    then((exitCode) => t.is(exitCode, 0));
});

test("validateMarkdownlintConfigSchema", async (t) => {
  t.plan(27);

  // Validate schema
  // @ts-ignore
  const ajv = new Ajv({
    "allowUnionTypes": true
  });
  const validateConfigSchema = ajv.compile(markdownlintConfigSchemaDefinition);
  t.is(
    markdownlintConfigSchemaDefinition.$id.replace(schemaIdVersionRe, "$<version>"),
    packageJson.dependencies.markdownlint
  );
  t.is(
    markdownlintConfigSchemaDefinition.$id,
    markdownlintConfigSchemaDefinition.properties.$schema.default
  );

  // Validate instances
  const files = await globby.globby(
    [
      "**/*.markdownlint.(json|jsonc)",
      "!node_modules/**",
      "!**/*-copy-*/**",
      "!**/*invalid/**",
      "!**/*mismatch/**",
      "!**/*null/**",
      "!**/invalid.*"
    ],
    {
      "dot": true
    }
  );
  return Promise.all(files.map(async (file) => {
    const content = await fs.readFile(file, "utf8");
    const json = jsoncParse(content);
    const instanceResult = validateConfigSchema(json);
    t.truthy(
      instanceResult,
      `${file}\n${JSON.stringify(validateConfigSchema.errors, null, 2)}`
    );
  }));
});

test("validateMarkdownlintCli2ConfigSchema", async (t) => {
  t.plan(93);

  // Validate schema
  // @ts-ignore
  const ajv = new Ajv({
    "allowUnionTypes": true,
    "strictTuples": false
  });
  ajv.addSchema(markdownlintConfigSchemaDefinition);
  const validateConfigSchema = ajv.compile(markdownlintCli2ConfigSchemaDefinition);
  t.is(
    markdownlintCli2ConfigSchemaDefinition.$id.replace(schemaIdVersionRe, "$<version>"),
    packageJson.version
  );
  t.is(
    markdownlintCli2ConfigSchemaDefinition.$id,
    markdownlintCli2ConfigSchemaDefinition.properties.$schema.default
  );

  // Validate instances
  const files = await globby.globby(
    [
      "**/*.markdownlint-cli2.(json|jsonc)",
      "!node_modules/**",
      "!**/*-copy-*/**",
      "!**/*invalid/**",
      "!**/*mismatch/**",
      "!**/*null/**",
      "!**/invalid.*",
      "!test/customRules/dir/subdir2/.markdownlint-cli2.jsonc"
    ],
    {
      "dot": true
    }
  );
  return Promise.all(files.map(async (file) => {
    const content = await fs.readFile(file, "utf8");
    const json = jsoncParse(content);
    const instanceResult = validateConfigSchema(json);
    t.truthy(
      instanceResult,
      `${file}\n${JSON.stringify(validateConfigSchema.errors, null, 2)}`
    );
  }));
});

test("validateExampleObjectsMatch", async (t) => {
  t.plan(1);
  const jsonExample = jsoncParse(
    await fs.readFile(
      "./test/markdownlint-cli2-jsonc-example/.markdownlint-cli2.jsonc",
      "utf8"
    )
  );
  const yamlExample = yamlParse(
    await fs.readFile(
      "./test/markdownlint-cli2-yaml-example/.markdownlint-cli2.yaml",
      "utf8"
    )
  );
  t.deepEqual(jsonExample, yamlExample);
});

test("absolute path to directory glob", async (t) => {
  t.plan(1);
  const argv = [ path.resolve("./test/no-config") ];
  const exitCode = await markdownlintCli2({ argv });
  t.is(exitCode, 1);
});

test("main options default", (t) => {
  t.plan(2);
  const uncalled = (/** @type {string} */ msg) => t.fail(`message logged: ${msg}`);
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
        "customRules": [ firstLine ]
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
  const uncalled = (/** @type {string} */ msg) => t.fail(`message logged: ${msg}`);
  return markdownlintCli2({
    "directory": "test/main-options-override",
    "argv": [ "*.md" ],
    "logError": uncalled,
    "optionsOverride": {
      "config": {
        "no-trailing-spaces": false
      },
      "fix": false,
      // @ts-ignore
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
    "./formatter-codequality/README.md",
    "./formatter-json/README.md",
    "./formatter-junit/README.md",
    "./formatter-pretty/README.md",
    "./formatter-sarif/README.md",
    "./formatter-summarize/README.md",
    "./formatter-template/README.md",
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
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 7) ] ]
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
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 4) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, file, no changes", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": __dirname(import.meta),
    "argv": [ ":./markdownlint-json/viewme.md" ],
    "optionsOverride": {
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 4) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, file, changes", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": __dirname(import.meta),
    "argv": [ ":./markdownlint-json/viewme.md" ],
    "fileContents": {
      "./markdownlint-json/viewme.md": "# Title\n\n> Tagline \n\n\n"
    },
    "optionsOverride": {
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 1) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, no file", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": __dirname(import.meta),
    "argv": [],
    "nonFileContents": {
      "untitled-1": "# Title\n\nText\t\n"
    },
    "optionsOverride": {
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 2) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, no file, empty", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": __dirname(import.meta),
    "argv": [],
    "nonFileContents": {
      "untitled-1": ""
    },
    "optionsOverride": {
      // @ts-ignore
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
    "directory": path.join(__dirname(import.meta), "extension-scenario-ignores"),
    argv,
    fileContents,
    "optionsOverride": {
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 6) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, ignores handled, absolute paths", (t) => {
  t.plan(2);
  const directory = path.join(__dirname(import.meta), "extension-scenario-ignores");
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
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 6) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("extension scenario, globs ignored/filtered", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": path.join(__dirname(import.meta), "extension-scenario-globs"),
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
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 4) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("backslash translation", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": __dirname(import.meta),
    "argv": [
      "./markdownlint-json/viewme.md",
      "markdownlint-jsonc/viewme.md",
      path.join(__dirname(import.meta), "markdownlint-cli2-jsonc/viewme.md"),
      ".\\markdownlint-yml\\viewme.md",
      "markdownlint-yaml\\viewme.md",
      path.join(__dirname(import.meta), "markdownlint-cli2-yaml\\viewme.md")
    ],
    "optionsOverride": {
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 24) ] ]
    }
  }).
    then((exitCode) => t.is(exitCode, 1));
});

test("custom fs, extension scenario for untitled", (t) => {
  t.plan(4);
  let accessCalls = 0;
  const access = (/** @type {string} */ file) => {
    accessCalls++;
    return (path.basename(file) === ".markdownlint-cli2.jsonc")
      ? Promise.resolve()
      : Promise.reject(new Error("No access"));
  };
  const readFile = (/** @type {string} */ file) => {
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
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 1) ] ]
    },
    "fs": {
      "promises": {
        access,
        readFile,
        writeFile
      }
    },
    "noImport": true
  }).
    then((exitCode) => {
      t.is(exitCode, 1);
      t.is(accessCalls, 7);
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
    }
  }).
    then((exitCode) => {
      t.is(exitCode, 0);
    });
});

test("custom fs, file and path including/escaping ':'", (t) => {
  t.plan(2);
  const names = [
    "normal.md",
    ":literal.md",
    "\\:escaped.md",
    "path/normal.md",
    ":path/literal.md",
    "\\:path/escaped.md"
  ];
  /** @type {[string, string][]} */
  const files = names.map((name) =>
    [ `/dir/${name.replace(/^:/u, "").replace(/^\\:/u, ":")}`, "# Heading" ]
  );
  return markdownlintCli2({
    "directory": "/dir",
    "argv": names,
    "optionsOverride": {
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 6) ] ]
    },
    "fs": new FsVirtual(files)
  }).
    then((exitCode) => {
      t.is(exitCode, 1);
    });
});

test("custom fs, using node:fs", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": "test/markdownlint-cli2-jsonc",
    "argv": [ "**/*.md" ],
    "optionsOverride": {
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 10) ] ]
    },
    "fs": nodeFs
  }).
    then((exitCode) => {
      t.is(exitCode, 1);
    });
});

test("custom fs, using node:fs and noImport=false", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": "test/markdownlint-cjs",
    "argv": [ "**/*.md" ],
    "optionsOverride": {
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 11) ] ]
    },
    "fs": nodeFs,
    "noImport": false
  }).
    then((exitCode) => {
      t.is(exitCode, 1);
    });
});

test("custom fs, using node:fs and noImport=true", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "directory": "test/markdownlint-cjs",
    "argv": [ "**/*.md" ],
    "optionsOverride": {
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 14) ] ]
    },
    "fs": nodeFs,
    "noImport": true
  }).
    then((exitCode) => {
      t.is(exitCode, 1);
    });
});

test("custom fs, using FsVirtual", async (t) => {
  t.plan(2);
  const baseDir = "/virtual";
  const directory = path.join(__dirname(import.meta), "markdownlint-cli2-jsonc");
  const files = await FsVirtual.mirrorDirectory(nodeFs, directory, globby, baseDir);
  const exitCode = await markdownlintCli2({
    "directory": baseDir,
    "argv": [ "**/*.md", "viewme.md" ],
    "optionsOverride": {
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 10) ] ]
    },
    "fs": new FsVirtual(files),
    "noImport": true
  });
  t.is(exitCode, 1);
});

test("--help", (t) => {
  t.plan(2);
  /** @type {string[]} */
  const stdouts = [];
  return markdownlintCli2({
    "argv": [ "--help" ],
    "logMessage": (/** @type {string} */ msg) => stdouts.push(msg),
    "logError": (/** @type {string} */ msg) => t.fail(`message logged: ${msg}`)
  }).
    then((exitCode) => {
      t.is(exitCode, 2);
      t.regex(stdouts[0], /^markdownlint-cli2 v/u);
    });
});

test("--help, glob also present", (t) => {
  t.plan(2);
  /** @type {string[]} */
  const stdouts = [];
  return markdownlintCli2({
    "argv": [ "README.md", "--help" ],
    "logMessage": (/** @type {string} */ msg) => stdouts.push(msg),
    "logError": (/** @type {string} */ msg) => t.fail(`message logged: ${msg}`)
  }).
    then((exitCode) => {
      t.is(exitCode, 2);
      t.regex(stdouts[0], /^markdownlint-cli2 v/u);
    });
});

test("-- stops matching parameters per POSIX Utility Conventions 12.2 Guideline 10", async (t) => {
  t.plan(17);
  /** @type {[string, string][]} */
  const files = [
    [ "/--fix", "# Title" ],
    [ "/bad.md", "# Title" ],
    [ "/good.md", "# Title\n" ]
  ];
  const scenario = async (/** @type {string[]} */ argv, /** @type {number} */ exitCode) => t.is(
    await markdownlintCli2({
      argv,
      "directory": "/",
      "fs": new FsVirtual(files)
    }),
    exitCode
  );
  await scenario([], 2);
  await scenario([ "--" ], 2);
  await scenario([ "--fix" ], 2);
  await scenario([ "--fix", "--" ], 2);
  await scenario([ "--", "--fix" ], 1);
  await scenario([ "bad.md" ], 1);
  await scenario([ "bad.md", "--" ], 1);
  await scenario([ "--", "bad.md" ], 1);
  await scenario([ "good.md" ], 0);
  await scenario([ "good.md", "--" ], 0);
  await scenario([ "--", "good.md" ], 0);
  await scenario([ "--fix", "--", "good.md" ], 0);
  await scenario([ "--fix", "--", "bad.md" ], 0);
  await scenario([ "good.md", "--", "--fix" ], 1);
  await scenario([ "bad.md", "--", "--fix" ], 1);
  await scenario([ "--", "--" ], 0);
  files.push([ "/--", "# Title" ]);
  await scenario([ "--", "--" ], 1);
});

test ("- not supported by main entry point", (t) => {
  t.plan(2);
  return markdownlintCli2({
    "argv": [ "-" ],
    "optionsOverride": {
      // @ts-ignore
      "outputFormatters": [ [ outputFormatterLengthIs(t, 0) ] ]
    }
  }).
    then((exitCode) => {
      t.is(exitCode, 0);
    });
});
