// @ts-check

/* eslint-disable jsdoc/reject-any-type */

/**
 * Deep-freezes an object and returns it.
 * @param {any} obj Object to deep freeze.
 * @returns {any} Object
 */
const deepFreeze = (obj) => {
  JSON.stringify(obj, (key, value) => Object.freeze(value));
  return obj;
};

// eslint-disable-next-line no-undef
module.exports = {
  deepFreeze
};
