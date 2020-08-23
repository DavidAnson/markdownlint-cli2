// @ts-check

"use strict";

const sliceSize = 1000;

/**
 * Efficiently appends the source array to the destination array.
 * @param {Object[]} destination Destination Array.
 * @param {Object[]} source Source Array.
 * @returns void
 */
const appendToArray = (destination, source) => {
  // NOTE: destination.push(...source) throws "RangeError: Maximum call stack
  // size exceeded" for sufficiently long source arrays
  let index = 0;
  let slice = null;
  while ((slice = source.slice(index, index + sliceSize)).length > 0) {
    destination.push(...slice);
    index += sliceSize;
  }
};

module.exports = appendToArray;
