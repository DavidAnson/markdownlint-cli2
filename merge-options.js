// @ts-check

"use strict";

/**
 * Merges two options objects by combining config and replacing properties.
 * @param {Object} first First options object.
 * @param {Object} second Second options object.
 * @returns {Object} Merged options object.
 */
const mergeOptions = (first, second) => {
  const merged = {
    ...first,
    ...second
  };
  const firstConfig = first && first.config;
  const secondConfig = second && second.config;
  if (firstConfig || secondConfig) {
    merged.config = {
      ...firstConfig,
      ...secondConfig
    };
  }
  return merged;
};

module.exports = mergeOptions;
