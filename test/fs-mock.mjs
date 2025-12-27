// @ts-check

import fs from "node:fs";
import nodePath from "node:path";

/* eslint-disable jsdoc/no-undefined-types */

const mapPath = (/** @type {string} */ base, /** @type {string} */ mockPath) => (
  nodePath.resolve(base, nodePath.relative("/mock", mockPath))
);

class fsMock {
  constructor(/** @type {string} */ base) {
    this.promises = {
      // eslint-disable-next-line unicorn/no-useless-undefined
      "access": (/** @type {string} */ path, /** @type {number | undefined} */ mode = undefined) => (
        fs.promises.access(mapPath(base, path), mode)
      ),
      "readFile": (/** @type {string} */ path, /** @type {NodeJS.BufferEncoding} */ options) => (
        fs.promises.readFile(mapPath(base, path), options)
      ),
      // eslint-disable-next-line unicorn/no-useless-undefined
      "stat": (/** @type {string} */ path, /** @type {object | undefined} */ opts = undefined) => (
        fs.promises.stat(mapPath(base, path), opts)
      ),
      "writeFile": (/** @type {string} */ path, /** @type {string} */ data, /** @type {NodeJS.BufferEncoding} */ options) => (
        fs.promises.writeFile(mapPath(base, path), data, options)
      )
    };
    this.access = (/** @type {string} */ path, /** @type {number} */ mode, /** @type {((err: NodeJS.ErrnoException | null) => void)} */ callback) => (
      fs.access(mapPath(base, path), mode, callback)
    );
    this.lstat = (/** @type {string} */ path, /** @type {object} */ options, /** @type {((err: NodeJS.ErrnoException | null, stats: fs.Stats) => void)} */ callback) => {
      if (!callback) {
        // @ts-ignore
        // eslint-disable-next-line no-param-reassign
        callback = options;
        // eslint-disable-next-line no-param-reassign
        options = {};
      }
      return fs.lstat(mapPath(base, path), options, (err, stats) => {
        if (err) {
          // @ts-ignore
          return callback(err);
        }
        // @ts-ignore
        return callback(null, stats);
      });
    };
    this.readdir = (/** @type {string} */ path, /** @type {NodeJS.BufferEncoding} */ options, /** @type {((err: NodeJS.ErrnoException | null, files: string[]) => void)} */ callback) => (
      fs.readdir(mapPath(base, path), options, callback)
    );
    this.readFile = (/** @type {string} */ path, /** @type {NodeJS.BufferEncoding} */ options, /** @type {((err: NodeJS.ErrnoException | null, data: string) => void)} */ callback) => (
      fs.readFile(mapPath(base, path), options, callback)
    );
  }
}

export default fsMock;
