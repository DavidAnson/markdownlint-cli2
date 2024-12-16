// @ts-check

/**
 * Wrapper for calling Node's require.resolve with additional paths.
 * @param {object} require Node's require implementation (or equivalent).
 * @param {string} request Module path to require.
 * @param {string[]} paths Paths to resolve module location from.
 * @returns {string} Resolved file name.
 */
const resolveModule = (require, request, paths) => {
  const resolvePaths = require.resolve.paths ? require.resolve.paths("") : [];
  const allPaths = [ ...paths, ...resolvePaths ];
  return require.resolve(request, { "paths": allPaths });
};

export default resolveModule;
