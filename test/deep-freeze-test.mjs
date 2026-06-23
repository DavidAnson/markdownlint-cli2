// @ts-check

/* eslint-disable no-return-assign, object-shorthand */

import test from "node:test";
import { deepFreeze } from "./deep-freeze.cjs";

const testArray = [ undefined, null, 5, "hello", {} ];
const testFunction = () => 5;
const testObject = {
  "undefined": undefined,
  "null": null,
  "number": 5,
  "string": "hello",
  "array": [ ...testArray ],
  "function": testFunction,
  "object": {
    "undefined": undefined,
    "null": null,
    "number": 5,
    "string": "hello",
    "array": [ ...testArray ],
    "function": testFunction,
    "object": {
      "undefined": undefined,
      "null": null,
      "number": 5,
      "string": "hello",
      "array": [ ...testArray ],
      "function": testFunction,
      "object": {}
    }
  }
};

test.suite(import.meta.url.replace(/^.*?\/(?<name>[^/]*)$/u, "$<name>"), () => {

  test("undefined", (t) => {
    t.plan(1);
    const expected = undefined;
    t.assert.deepEqual(deepFreeze(expected), expected);
  });

  test("null", (t) => {
    t.plan(1);
    const expected = null;
    t.assert.deepEqual(deepFreeze(expected), expected);
  });

  test("number", (t) => {
    t.plan(1);
    const expected = 5;
    t.assert.deepEqual(deepFreeze(expected), expected);
  });

  test("string", (t) => {
    t.plan(1);
    const expected = "hello";
    t.assert.deepEqual(deepFreeze(expected), expected);
  });

  test("array", (t) => {
    t.plan(1);
    const expected = [ ...testArray ];
    t.assert.deepEqual(deepFreeze(expected), expected);
  });

  test("function", (t) => {
    t.plan(1);
    const expected = testFunction;
    t.assert.deepEqual(deepFreeze(expected), expected);
  });

  test("object", (t) => {
    t.plan(2);
    const expected = { ...testObject };
    t.assert.deepEqual(deepFreeze(expected), expected);
    t.assert.deepEqual(expected, testObject);
  });

  test("frozen", (t) => {
    t.plan(15);
    const frozen = deepFreeze({ ...testObject });
    const errorRe = /Cannot assign to read only property/u;
    t.assert.throws(() => frozen.number = 1, errorRe);
    t.assert.throws(() => frozen.string = "", errorRe);
    t.assert.throws(() => frozen.array[0] = 1, errorRe);
    t.assert.throws(() => frozen.object = {}, errorRe);
    t.assert.throws(() => frozen.function = () => 1, errorRe);
    t.assert.throws(() => frozen.object.number = 1, errorRe);
    t.assert.throws(() => frozen.object.string = "", errorRe);
    t.assert.throws(() => frozen.object.array[0] = 1, errorRe);
    t.assert.throws(() => frozen.object.object = {}, errorRe);
    t.assert.throws(() => frozen.object.function = () => 1, errorRe);
    t.assert.throws(() => frozen.object.object.number = 1, errorRe);
    t.assert.throws(() => frozen.object.object.string = "", errorRe);
    t.assert.throws(() => frozen.object.object.array[0] = 1, errorRe);
    t.assert.throws(() => frozen.object.object.object = {}, errorRe);
    t.assert.throws(() => frozen.object.object.function = () => 1, errorRe);
  });

});
