// @ts-check

import { homedir } from "os";
import { dirname, relative, resolve } from "path";
import { fileURLToPath } from "url";

const makeTildePath = (script) => {
  const dir = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "scripts",
    script
  );
  return `~/${relative(homedir(), dir)}`;
};

const options = {
  "customRules": [
    makeTildePath("any-blockquote.mjs")
  ],
  "markdownItPlugins": [
    [ makeTildePath("custom-markdown-it-plugin.mjs") ]
  ],
  "outputFormatters": [
    [ makeTildePath("custom-output-formatter.mjs") ]
  ]
};

export default options;
