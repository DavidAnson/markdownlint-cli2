// @ts-check

"use strict";

const dirent = (path, directory) => {
  const name = path.replace(/^.*\//u, "");
  return {
    name,
    "isBlockDevice": () => false,
    "isCharacterDevice": () => false,
    "isDirectory": directory ? () => true : () => false,
    "isFIFO": () => false,
    "isFile": directory ? () => false : () => true,
    "isSocket": () => false,
    "isSymbolicLink": () => false
  };
};

const normalize = (path) => path.replace(/^[A-Za-z]:/u, "").replaceAll("\\", "/");

/* eslint-disable no-param-reassign */

class FsVirtual {
  constructor(files) {

    this.files = new Map(files);

    this.promises = {};

    this.promises.access = (path) => {
      path = normalize(path);
      if (this.files.has(path)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error(`fs-virtual:promises.access(${path})`));
    };

    this.promises.readFile = (path) => {
      path = normalize(path);
      const content = this.files.get(path);
      if (content) {
        return Promise.resolve(content);
      }
      return Promise.reject(new Error(`fs-virtual:promises.readFile(${path})`));
    };

    this.promises.stat = (path) => {
      path = normalize(path);
      if (this.files.has(path)) {
        return Promise.resolve(dirent(path));
      }
      return Promise.reject(new Error(`fs-virtual:promises.stat(${path})`));
    };

    this.promises.writeFile = (path, data) => {
      path = normalize(path);
      this.files.set(path, data);
    };

    this.access = (path, mode, callback) => {
      path = normalize(path);
      if (this.files.has(path)) {
        return (callback || mode)();
      }
      return (callback || mode)(new Error(`fs-virtual:access(${path})`));
    };

    // eslint-disable-next-line no-multi-assign
    this.stat = this.lstat = (path, callback) => {
      path = normalize(path);
      if (this.files.has(path)) {
        return callback(null, dirent(path, false));
      }
      return callback(null, dirent(path, true));
    };

    this.readdir = (path, options, callback) => {
      path = normalize(path);
      const names = [];
      for (const file of this.files.keys()) {
        if (file.startsWith(`${path}`)) {
          const [ name ] = file.slice(path.length).split("/");
          if (!names.includes(name)) {
            names.push(name);
          }
        }
      }
      return (callback || options)(null, names);
    };

    this.readFile = (path, options, callback) => {
      path = normalize(path);
      const content = this.files.get(path);
      if (content) {
        return callback(null, content);
      }
      return callback(new Error(`fs-virtual:readFile(${path})`));
    };
  }
}

if (typeof module !== "undefined") {
  module.exports = FsVirtual;
}
