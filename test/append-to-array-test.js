// @ts-check

"use strict";

const tape = require("tape");
require("tape-player");
const appendToArray = require("../append-to-array");
const { sliceSize } = appendToArray;

const makeArray = (minimum, maximum) => {
  const array = new Array(maximum - minimum + 1);
  for (let i = 0, j = minimum; j <= maximum; i++, j++) {
    array[i] = j;
  }
  return array;
};

const checkArray =
  (array, maximum) => ((array.length === (maximum + 1)) &&
    array.every((v, i) => v === i));

tape("empty source and destination", (test) => {
  test.plan(1);
  const destination = [];
  const source = [];
  appendToArray(destination, source);
  test.deepEqual(destination, []);
});

tape("empty source", (test) => {
  test.plan(1);
  const destination = makeArray(0, 3);
  const source = [];
  appendToArray(destination, source);
  test.ok(checkArray(destination, 3));
});

tape("empty destination", (test) => {
  test.plan(1);
  const destination = [];
  const source = makeArray(0, 2);
  appendToArray(destination, source);
  test.ok(checkArray(destination, 2));
});

tape("small source and small destination", (test) => {
  test.plan(1);
  const destination = makeArray(0, 4);
  const source = makeArray(5, 5);
  appendToArray(destination, source);
  test.ok(checkArray(destination, 5));
});

tape("small source and large destination", (test) => {
  test.plan(1);
  const destination = makeArray(0, 1000000);
  const source = makeArray(1000001, 1000003);
  appendToArray(destination, source);
  test.ok(checkArray(destination, 1000003));
});

tape("large source and small destination", (test) => {
  test.plan(1);
  const destination = makeArray(0, 3);
  const source = makeArray(4, 1000000);
  appendToArray(destination, source);
  test.ok(checkArray(destination, 1000000));
});

tape("large source and large destination", (test) => {
  test.plan(1);
  const destination = makeArray(0, 999999);
  const source = makeArray(1000000, 2000000);
  appendToArray(destination, source);
  test.ok(checkArray(destination, 2000000));
});

tape("sliceSize", (test) => {
  test.plan(1);
  const destination = [];
  const source = makeArray(0, sliceSize - 1);
  appendToArray(destination, source);
  test.ok(checkArray(destination, sliceSize - 1));
});

tape("sliceSize - 1", (test) => {
  test.plan(1);
  const destination = [];
  const source = makeArray(0, sliceSize - 2);
  appendToArray(destination, source);
  test.ok(checkArray(destination, sliceSize - 2));
});

tape("sliceSize + 1", (test) => {
  test.plan(1);
  const destination = [];
  const source = makeArray(0, sliceSize);
  appendToArray(destination, source);
  test.ok(checkArray(destination, sliceSize));
});
