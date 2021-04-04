// @ts-check

"use strict";

/**
 * Wrapper for calling Node's require.resolve/require with an additional path.
 *
 * @param {Object} req Node's require function (or equivalent).
 * @param {*} id Package identifier to require.
 * @param {*} dir Directory to include when resolving paths.
 * @returns {Object} Exported module content.
 */
const resolveAndRequire = (req, id, dir) => {
  const resolvePaths = req.resolve.paths ? req.resolve.paths("") : [];
  const paths = [ dir, ...resolvePaths ];
  const resolved = req.resolve(id, { paths });
  return req(resolved);
};

module.exports = resolveAndRequire;
