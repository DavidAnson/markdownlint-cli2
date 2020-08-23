// @ts-check

"use strict";

const tape = require("tape");
require("tape-player");
const appendToArray = require("../append-to-array");

const makeArray = (minimum, maximum) => {
  const array = new Array(maximum - minimum + 1);
  for (let i = 0, j = minimum; j <= maximum; i++, j++) {
    array[i] = j;
  }
  return array;
};

const checkArray = (array, minimum, maximum) => {
  if (array.length !== (maximum - minimum + 1)) {
    return false;
  }
  for (let i = 0, j = minimum; j <= maximum; i++, j++) {
    if (array[i] !== j) {
      return false;
    }
  }
  return true;
};

tape("empty source and destination", (test) => {
  test.plan(1);
  const destination = [];
  const source = [];
  appendToArray(destination, source);
  test.deepEqual(destination, []);
});

tape("empty source", (test) => {
  test.plan(1);
  const destination = makeArray(1, 3);
  const source = [];
  appendToArray(destination, source);
  test.ok(checkArray(destination, 1, 3));
});

tape("empty destination", (test) => {
  test.plan(1);
  const destination = [];
  const source = makeArray(4, 5);
  appendToArray(destination, source);
  test.ok(checkArray(destination, 4, 5));
});

tape("small source and small destination", (test) => {
  test.plan(1);
  const destination = makeArray(1, 3);
  const source = makeArray(4, 5);
  appendToArray(destination, source);
  test.ok(checkArray(destination, 1, 5));
});

tape("small source and large destination", (test) => {
  test.plan(1);
  const destination = makeArray(1, 1000000);
  const source = makeArray(1000001, 1000003);
  appendToArray(destination, source);
  test.ok(checkArray(destination, 1, 1000003));
});

tape("large source and small destination", (test) => {
  test.plan(1);
  const destination = makeArray(1, 3);
  const source = makeArray(4, 1000000);
  appendToArray(destination, source);
  test.ok(checkArray(destination, 1, 1000000));
});

tape("large source and large destination", (test) => {
  test.plan(1);
  const destination = makeArray(1, 1000000);
  const source = makeArray(1000001, 1999999);
  appendToArray(destination, source);
  test.ok(checkArray(destination, 1, 1999999));
});
