// @ts-check

"use strict";

/**
 * Wrapper for calling Node's require.resolve/require with an additional path.
 * @param {object} req Node's require implementation (or equivalent).
 * @param {string} id Package identifier to require.
 * @param {string[]} dirs Directories to include when resolving paths.
 * @returns {object} Exported module content.
 */
const resolveAndRequire = (req, id, dirs) => {
  const resolvePaths = req.resolve.paths ? req.resolve.paths("") : [];
  const paths = [ ...dirs, ...resolvePaths ];
  const resolved = req.resolve(id, { paths });
  return req(resolved);
};

module.exports = resolveAndRequire;
