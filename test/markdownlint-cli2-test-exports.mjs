// @ts-check

import test from "ava";
import { importWithTypeJson } from "./esm-helpers.mjs";
const packageJson = await importWithTypeJson("../package.json");

const exportMappings = new Map([
  [ ".", "../markdownlint-cli2.mjs" ],
  [ "./markdownlint", "markdownlint" ],
  [ "./markdownlint/helpers", "markdownlint/helpers" ],
  [ "./parsers", "../parsers/parsers.mjs" ],
  [ "./parsers/jsonc", "../parsers/jsonc-parse.mjs" ],
  [ "./parsers/yaml", "../parsers/yaml-parse.mjs" ]
]);

test("exportMappings", (t) => {
  t.deepEqual(
    Object.keys(packageJson.exports),
    [ ...exportMappings.keys() ]
  );
});

const commonJsRe = /.js$/u;

for (const [ exportName, exportPath ] of exportMappings) {
  test(exportName, async (t) => {
    const commonJs = !commonJsRe.test(exportPath);
    const importExportName = await import(exportName.replace(/^\./u, packageJson.name));
    const importExportPath = await import(exportPath);
    t.is(
      commonJs ? importExportName.default : importExportName,
      commonJs ? importExportPath.default : importExportPath
    );
  });
}
