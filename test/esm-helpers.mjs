// @ts-check

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Shims import.meta.filename on Node 18
// eslint-disable-next-line no-underscore-dangle
export const __filename = (meta) => fileURLToPath(meta.url);

// Shims import.meta.dirname on Node 18
// eslint-disable-next-line no-underscore-dangle
export const __dirname = (meta) => path.dirname(__filename(meta));

// Avoids "ExperimentalWarning: Importing JSON modules is an experimental feature and might change at any time"
export const importWithTypeJson = async (file) => (
  // @ts-ignore
  JSON.parse(await fs.readFile(path.resolve(__dirname(import.meta), file)))
);
