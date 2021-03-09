// @ts-check

"use strict";

const test = require("ava").default;
const mergeOptions = require("../merge-options");

test("null/null", (t) => {
  t.plan(1);
  t.deepEqual(
    mergeOptions(null, null),
    {}
  );
});

test("empty/empty", (t) => {
  t.plan(1);
  t.deepEqual(
    mergeOptions({}, {}),
    {}
  );
});

test("full/empty", (t) => {
  t.plan(1);
  t.deepEqual(
    mergeOptions(
      {
        "config": {
          "no-trailing-spaces": false,
          "no-multiple-blanks": false
        },
        "customRules": [ "markdownlint-rule-titlecase" ],
        "fix": true
      },
      {}
    ),
    {
      "config": {
        "no-trailing-spaces": false,
        "no-multiple-blanks": false
      },
      "customRules": [ "markdownlint-rule-titlecase" ],
      "fix": true
    }
  );
});

test("empty/full", (t) => {
  t.plan(1);
  t.deepEqual(
    mergeOptions(
      {},
      {
        "config": {
          "no-trailing-spaces": false,
          "no-multiple-blanks": false
        },
        "customRules": [ "markdownlint-rule-titlecase" ],
        "fix": true
      }
    ),
    {
      "config": {
        "no-trailing-spaces": false,
        "no-multiple-blanks": false
      },
      "customRules": [ "markdownlint-rule-titlecase" ],
      "fix": true
    }
  );
});

test("partial/partial merge", (t) => {
  t.plan(1);
  t.deepEqual(
    mergeOptions(
      {
        "config": {
          "no-trailing-spaces": false
        },
        "customRules": [ "markdownlint-rule-titlecase" ]
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
      "customRules": [ "markdownlint-rule-titlecase" ],
      "fix": true
    }
  );
});

test("full/full replace", (t) => {
  t.plan(1);
  t.deepEqual(
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
        "customRules": [ "markdownlint-rule-titlecase" ],
        "fix": true
      }
    ),
    {
      "config": {
        "no-trailing-spaces": false,
        "no-multiple-blanks": false
      },
      "customRules": [ "markdownlint-rule-titlecase" ],
      "fix": true
    }
  );
});

test("sparse/full", (t) => {
  t.plan(1);
  t.deepEqual(
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
  t.deepEqual(
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
