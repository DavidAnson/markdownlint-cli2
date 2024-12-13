// @ts-check

import fs from "node:fs";
import nodePath from "node:path";

const mapPath = (base, mockPath) => (
  nodePath.resolve(base, nodePath.relative("/mock", mockPath))
);

class fsMock {
  constructor(base, symbolicLinks) {
    this.promises = {};
    this.promises.access = (path, mode) => (
      fs.promises.access(mapPath(base, path), mode)
    );
    this.promises.readFile = (path, options) => (
      fs.promises.readFile(mapPath(base, path), options)
    );
    this.promises.stat = (path, opts) => (
      fs.promises.stat(mapPath(base, path), opts)
    );
    this.promises.writeFile = (path, data, options) => (
      fs.promises.writeFile(mapPath(base, path), data, options)
    );
    this.access = (path, mode, callback) => (
      fs.access(mapPath(base, path), mode, callback)
    );
    this.lstat = (path, options, callback) => {
      if (!callback) {
        // eslint-disable-next-line no-param-reassign
        callback = options;
        // eslint-disable-next-line no-param-reassign
        options = {};
      }
      return fs.lstat(mapPath(base, path), options, (err, stats) => {
        if (err) {
          return callback(err);
        }
        if (symbolicLinks) {
          stats.isSymbolicLink = () => true;
        }
        return callback(null, stats);
      });
    };
    this.stat = (path, options, callback) => (
      fs.stat(mapPath(base, path), options, callback)
    );
    this.readdir = (path, options, callback) => (
      fs.readdir(mapPath(base, path), options, callback)
    );
    this.readFile = (path, options, callback) => (
      fs.readFile(mapPath(base, path), options, callback)
    );
  }
}

export default fsMock;
