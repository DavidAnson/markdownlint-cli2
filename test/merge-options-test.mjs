// @ts-check

import test from "node:test";
import mergeOptions from "../merge-options.mjs";

test.suite(import.meta.url.replace(/^.*?\/(?<name>[^/]*)$/u, "$<name>"), () => {

  test("null/null", (t) => {
    t.plan(1);
    t.assert.deepEqual(
      mergeOptions(null, null),
      {}
    );
  });

  test("empty/empty", (t) => {
    t.plan(1);
    t.assert.deepEqual(
      mergeOptions({}, {}),
      {}
    );
  });

  test("full/null", (t) => {
    t.plan(1);
    t.assert.deepEqual(
      mergeOptions(
        {
          "config": {
            "no-trailing-spaces": false,
            "no-multiple-blanks": false
          },
          "customRules": [ "markdownlint-rule-extended-ascii" ],
          "fix": true
        },
        null
      ),
      {
        "config": {
          "no-trailing-spaces": false,
          "no-multiple-blanks": false
        },
        "customRules": [ "markdownlint-rule-extended-ascii" ],
        "fix": true
      }
    );
  });

  test("null/full", (t) => {
    t.plan(1);
    t.assert.deepEqual(
      mergeOptions(
        null,
        {
          "config": {
            "no-trailing-spaces": false,
            "no-multiple-blanks": false
          },
          "customRules": [ "markdownlint-rule-extended-ascii" ],
          "fix": true
        }
      ),
      {
        "config": {
          "no-trailing-spaces": false,
          "no-multiple-blanks": false
        },
        "customRules": [ "markdownlint-rule-extended-ascii" ],
        "fix": true
      }
    );
  });

  test("full/empty", (t) => {
    t.plan(1);
    t.assert.deepEqual(
      mergeOptions(
        {
          "config": {
            "no-trailing-spaces": false,
            "no-multiple-blanks": false
          },
          "customRules": [ "markdownlint-rule-extended-ascii" ],
          "fix": true
        },
        {}
      ),
      {
        "config": {
          "no-trailing-spaces": false,
          "no-multiple-blanks": false
        },
        "customRules": [ "markdownlint-rule-extended-ascii" ],
        "fix": true
      }
    );
  });

  test("empty/full", (t) => {
    t.plan(1);
    t.assert.deepEqual(
      mergeOptions(
        {},
        {
          "config": {
            "no-trailing-spaces": false,
            "no-multiple-blanks": false
          },
          "customRules": [ "markdownlint-rule-extended-ascii" ],
          "fix": true
        }
      ),
      {
        "config": {
          "no-trailing-spaces": false,
          "no-multiple-blanks": false
        },
        "customRules": [ "markdownlint-rule-extended-ascii" ],
        "fix": true
      }
    );
  });

  test("partial/partial merge", (t) => {
    t.plan(1);
    t.assert.deepEqual(
      mergeOptions(
        {
          "config": {
            "no-trailing-spaces": false
          },
          "customRules": [ "markdownlint-rule-extended-ascii" ]
        },
        {
          "config": {
            "no-multiple-blanks": false
          },
          "fix": true
        }
      ),
      {
        "config": {
          "no-trailing-spaces": false,
          "no-multiple-blanks": false
        },
        "customRules": [ "markdownlint-rule-extended-ascii" ],
        "fix": true
      }
    );
  });

  test("full/full replace", (t) => {
    t.plan(1);
    t.assert.deepEqual(
      mergeOptions(
        {
          "config": {
            "no-trailing-spaces": true,
            "no-multiple-blanks": true
          },
          "customRules": [ "markdownlint-rule-lowercase" ],
          "fix": false
        },
        {
          "config": {
            "no-trailing-spaces": false,
            "no-multiple-blanks": false
          },
          "customRules": [ "markdownlint-rule-extended-ascii" ],
          "fix": true
        }
      ),
      {
        "config": {
          "no-trailing-spaces": false,
          "no-multiple-blanks": false
        },
        "customRules": [ "markdownlint-rule-extended-ascii" ],
        "fix": true
      }
    );
  });

  test("sparse/full", (t) => {
    t.plan(1);
    t.assert.deepEqual(
      mergeOptions(
        {
          "config": {},
          "fix": true
        },
        {
          "config": {
            "no-trailing-spaces": false,
            "no-multiple-blanks": false
          }
        }
      ),
      {
        "config": {
          "no-trailing-spaces": false,
          "no-multiple-blanks": false
        },
        "fix": true
      }
    );
  });

  test("full/sparse", (t) => {
    t.plan(1);
    t.assert.deepEqual(
      mergeOptions(
        {
          "config": {
            "no-trailing-spaces": false,
            "no-multiple-blanks": false
          }
        },
        {
          "config": {},
          "fix": true
        }
      ),
      {
        "config": {
          "no-trailing-spaces": false,
          "no-multiple-blanks": false
        },
        "fix": true
      }
    );
  });

});
