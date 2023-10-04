// @ts-check

"use strict";

/**
 * Wrapper for calling Node's require.resolve/require with an additional path.
 * @param {Object} req Node's require implementation (or equivalent).
 * @param {String} id Package identifier to require.
 * @param {String[]} dirs Directories to include when resolving paths.
 * @returns {Object} Exported module content.
 */
const resolveAndRequire = (req, id, dirs) => {
  const resolvePaths = req.resolve.paths ? req.resolve.paths("") : [];
  const paths = [ ...dirs, ...resolvePaths ];
  const resolved = req.resolve(id, { paths });
  return req(resolved);
};

module.exports = resolveAndRequire;
