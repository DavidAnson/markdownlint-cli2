// @ts-check

"use strict";

const path = require("node:path");
const test = require("ava").default;
const packageJson = require("../package.json");

const exportMappings = new Map([
  [ ".", ".." ],
  [ "./markdownlint", "markdownlint" ],
  [ "./markdownlint/helpers", "markdownlint/helpers" ],
  [ "./parsers", "../parsers/parsers.js" ],
  [ "./parsers/jsonc", "../parsers/jsonc-parse.js" ],
  [ "./parsers/yaml", "../parsers/yaml-parse.js" ]
]);

test("exportMappings", (t) => {
  t.deepEqual(
    Object.keys(packageJson.exports),
    [ ...exportMappings.keys() ]
  );
});

for (const [ exportName, exportPath ] of exportMappings) {
  test(exportName, (t) => {
    t.is(
      require(path.join("..", packageJson.exports[exportName])),
      require(exportPath)
    );
  });
}
