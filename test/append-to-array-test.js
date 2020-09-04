// @ts-check

"use strict";

const test = require("ava");
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

// @ts-ignore
test("empty source and destination", (t) => {
  t.plan(1);
  const destination = [];
  const source = [];
  appendToArray(destination, source);
  t.deepEqual(destination, []);
});

// @ts-ignore
test("empty source", (t) => {
  t.plan(1);
  const destination = makeArray(0, 3);
  const source = [];
  appendToArray(destination, source);
  t.true(checkArray(destination, 3));
});

// @ts-ignore
test("empty destination", (t) => {
  t.plan(1);
  const destination = [];
  const source = makeArray(0, 2);
  appendToArray(destination, source);
  t.true(checkArray(destination, 2));
});

// @ts-ignore
test("small source and small destination", (t) => {
  t.plan(1);
  const destination = makeArray(0, 4);
  const source = makeArray(5, 5);
  appendToArray(destination, source);
  t.true(checkArray(destination, 5));
});

// @ts-ignore
test("small source and large destination", (t) => {
  t.plan(1);
  const destination = makeArray(0, 1000000);
  const source = makeArray(1000001, 1000003);
  appendToArray(destination, source);
  t.true(checkArray(destination, 1000003));
});

// @ts-ignore
test("large source and small destination", (t) => {
  t.plan(1);
  const destination = makeArray(0, 3);
  const source = makeArray(4, 1000000);
  appendToArray(destination, source);
  t.true(checkArray(destination, 1000000));
});

// @ts-ignore
test("large source and large destination", (t) => {
  t.plan(1);
  const destination = makeArray(0, 999999);
  const source = makeArray(1000000, 2000000);
  appendToArray(destination, source);
  t.true(checkArray(destination, 2000000));
});

// @ts-ignore
test("sliceSize", (t) => {
  t.plan(1);
  const destination = [];
  const source = makeArray(0, sliceSize - 1);
  appendToArray(destination, source);
  t.true(checkArray(destination, sliceSize - 1));
});

// @ts-ignore
test("sliceSize - 1", (t) => {
  t.plan(1);
  const destination = [];
  const source = makeArray(0, sliceSize - 2);
  appendToArray(destination, source);
  t.true(checkArray(destination, sliceSize - 2));
});

// @ts-ignore
test("sliceSize + 1", (t) => {
  t.plan(1);
  const destination = [];
  const source = makeArray(0, sliceSize);
  appendToArray(destination, source);
  t.true(checkArray(destination, sliceSize));
});
