// @ts-check

import fs from "node:fs/promises";
import test from "node:test";
import workerpool from "workerpool";
import testCases from "./markdownlint-cli2-test-cases.mjs";
import { copyDir, removeDir } from "./markdownlint-cli2-test-helpers.mjs";

const baseDir = import.meta.dirname;
const pool = workerpool.pool(import.meta.filename.replace(/\.mjs$/u, "-worker.mjs"), { "minWorkers": 50 });

const invoke = (/** @type {string} */ relative, /** @type {string[]} */ args, /** @type {boolean | undefined} */ noImport, /** @type {Record<string, string> | undefined} */ env, /** @type {string | undefined} */ script) => () =>
  new Promise((resolve, reject) =>
    // eslint-disable-next-line no-promise-executor-return
    pool.
      exec("invokeWorker", [ relative, args, noImport, env, script ]).
      then((result) => {
        resolve({
          ...result,
          "readFile": fs.readFile
        });
      }).
      catch(reject)
  );

// eslint-disable-next-line node-test/require-top-level-describe
test.after(() => {
  pool.terminate();
});

test.suite(import.meta.url.replace(/^.*?\/(?<name>[^/]*)$/u, "$<name>"), () => {

  // eslint-disable-next-line node-test/require-hook
  testCases({
    "host": "exec",
    baseDir,
    invoke,
    copyDir,
    removeDir,
    "includeNoImport": false,
    "includeEnv": true,
    "includeScript": true,
    "usesVirtualFs": false
  });

});
