// @ts-check

import test from "node:test";
import cloneOptions from "../clone-options.mjs";
import { deepFreeze } from "./deep-freeze.cjs";

test.suite(import.meta.url.replace(/^.*?\/(?<name>[^/]*)$/u, "$<name>"), () => {

  test("null object", (t) => {
    t.plan(1);
    const obj = null;
    const clone = cloneOptions(obj);
    t.assert.deepEqual(clone, obj);
  });

  test("empty object", (t) => {
    t.plan(1);
    const obj = deepFreeze({});
    const clone = cloneOptions(obj);
    t.assert.deepEqual(clone, obj);
    clone.fix = false;
  });

  test("configuration object", (t) => {
    t.plan(1);
    const obj = deepFreeze(
      {
        "no-trailing-spaces": false,
        "no-multiple-blanks": false
      }
    );
    const clone = cloneOptions(obj);
    t.assert.deepEqual(clone, obj);
    // @ts-ignore
    clone.MD001 = true;
    // @ts-ignore
    clone["no-trailing-spaces"] = true;
  });

  test("options object", (t) => {
    t.plan(2);
    const obj = deepFreeze(
      {
        "config": {
          "no-trailing-spaces": false,
          "no-multiple-blanks": false
        },
        "customRules": [ "markdownlint-rule-extended-ascii" ],
        "fix": true,
        "overrides": [
          {
            "filter": [ "*.md" ],
            "config": {
              "first-line-heading": false
            },
            "combine": "merge"
          },
          {
            "filter": [ "filter" ],
            "combine": "merge"
          }
        ]
      }
    );
    const clone = cloneOptions(obj);
    t.assert.deepEqual(clone, obj);
    clone.fix = false;
    clone.noProgress = false;
    // @ts-ignore
    clone.config.MD001 = true;
    // @ts-ignore
    clone.config["no-trailing-spaces"] = true;
    // @ts-ignore
    clone.overrides[0].config.MD001 = true;
    // @ts-ignore
    clone.overrides[0].config["no-trailing-spaces"] = true;
    // @ts-ignore
    t.assert.equal(Object.hasOwn(clone.overrides[1], "config"), false);
  });

});
