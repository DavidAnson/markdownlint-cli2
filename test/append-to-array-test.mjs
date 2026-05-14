// @ts-check

import test from "node:test";
import appendToArray, { sliceSize } from "../append-to-array.mjs";

const makeArray = (/** @type {number} */ minimum, /** @type {number} */ maximum) => {
  const length = maximum - minimum + 1;
  const array = Array.from({ length });
  for (let i = 0, j = minimum; j <= maximum; i++, j++) {
    array[i] = j;
  }
  return array;
};

const checkArray =
  (/** @type {object[]} */ array, /** @type {number} */ maximum) => ((array.length === (maximum + 1)) &&
    array.every((v, i) => Number(v) === i));

/* eslint-disable unicorn/numeric-separators-style */

test.suite(import.meta.url.replace(/^.*?(?<name>[^/]*)$/u, "$<name>"), () => {

  test("empty source and destination", (t) => {
    t.plan(1);
    /** @type {object[]} */
    const destination = [];
    /** @type {object[]} */
    const source = [];
    appendToArray(destination, source);
    t.assert.deepEqual(destination, []);
  });

  test("empty source", (t) => {
    t.plan(1);
    const destination = makeArray(0, 3);
    /** @type {object[]} */
    const source = [];
    appendToArray(destination, source);
    t.assert.equal(checkArray(destination, 3), true);
  });

  test("empty destination", (t) => {
    t.plan(1);
    /** @type {object[]} */
    const destination = [];
    const source = makeArray(0, 2);
    appendToArray(destination, source);
    t.assert.equal(checkArray(destination, 2), true);
  });

  test("small source and small destination", (t) => {
    t.plan(1);
    const destination = makeArray(0, 4);
    const source = makeArray(5, 5);
    appendToArray(destination, source);
    t.assert.equal(checkArray(destination, 5), true);
  });

  test("small source and large destination", (t) => {
    t.plan(1);
    const destination = makeArray(0, 1000000);
    const source = makeArray(1000001, 1000003);
    appendToArray(destination, source);
    t.assert.equal(checkArray(destination, 1000003), true);
  });

  test("large source and small destination", (t) => {
    t.plan(1);
    const destination = makeArray(0, 3);
    const source = makeArray(4, 1000000);
    appendToArray(destination, source);
    t.assert.equal(checkArray(destination, 1000000), true);
  });

  test("large source and large destination", (t) => {
    t.plan(1);
    const destination = makeArray(0, 999999);
    const source = makeArray(1000000, 2000000);
    appendToArray(destination, source);
    t.assert.equal(checkArray(destination, 2000000), true);
  });

  test("sliceSize", (t) => {
    t.plan(1);
    /** @type {object[]} */
    const destination = [];
    const source = makeArray(0, sliceSize - 1);
    appendToArray(destination, source);
    t.assert.equal(checkArray(destination, sliceSize - 1), true);
  });

  test("sliceSize - 1", (t) => {
    t.plan(1);
    /** @type {object[]} */
    const destination = [];
    const source = makeArray(0, sliceSize - 2);
    appendToArray(destination, source);
    t.assert.equal(checkArray(destination, sliceSize - 2), true);
  });

  test("sliceSize + 1", (t) => {
    t.plan(1);
    /** @type {object[]} */
    const destination = [];
    const source = makeArray(0, sliceSize);
    appendToArray(destination, source);
    t.assert.equal(checkArray(destination, sliceSize), true);
  });

});
