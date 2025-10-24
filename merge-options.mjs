// @ts-check

/**
 * Merges two options objects by combining config and replacing properties.
 * @param {{ config: object }} first First options object.
 * @param {{ config: object }} second Second options object.
 * @returns {object} Merged options object.
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

export default mergeOptions;
