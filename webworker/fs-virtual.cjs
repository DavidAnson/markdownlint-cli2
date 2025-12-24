// @ts-check

"use strict";

/* eslint-disable jsdoc/no-undefined-types */

/** @typedef {import("fs").Stats} Stats */

const stats = (/** @type {string} */ path, /** @type {number} */ size, /** @type {boolean} */ symbolic = false) => {
  const directory = false;
  const date = new Date();
  /** @type {Stats} */
  return {
    "isBlockDevice": () => false,
    "isCharacterDevice": () => false,
    "isDirectory": directory ? () => true : () => false,
    "isFIFO": () => false,
    "isFile": directory ? () => false : () => true,
    "isSocket": () => false,
    "isSymbolicLink": symbolic ? () => true : () => false,
    "dev": 0,
    "ino": 0,
    "mode": 0,
    "nlink": 0,
    "uid": 0,
    "gid": 0,
    "rdev": 0,
    size,
    "blksize": 0,
    "blocks": 0,
    "atimeMs": 0,
    "mtimeMs": 0,
    "ctimeMs": 0,
    "birthtimeMs": 0,
    "atime": date,
    "mtime": date,
    "ctime": date,
    "birthtime": date
  };
};

const normalize = (/** @type {string} */ path) => path.replace(/^[A-Za-z]:/u, "").replaceAll("\\", "/");

/* eslint-disable no-param-reassign */

class FsVirtual {
  constructor(/** @type {[string, string][]} */ files) {

    this.files = new Map(files);

    this.promises = {

      "access": (/** @type {string} */ path) => {
        path = normalize(path);
        if (this.files.has(path)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error(`fs-virtual:promises.access(${path})`));
      },

      // eslint-disable-next-line no-unused-vars
      "readFile": (/** @type {string} */ path, /** @type {NodeJS.BufferEncoding} */ options) => {
        path = normalize(path);
        if (this.files.has(path)) {
          const content = this.files.get(path);
          return Promise.resolve(content);
        }
        return Promise.reject(new Error(`fs-virtual:promises.readFile(${path})`));
      },

      "stat": (/** @type {string} */ path) => {
        path = normalize(path);
        if (this.files.has(path)) {
          return Promise.resolve(stats(path, (this.files.get(path) || "").length, false));
        }
        return Promise.reject(new Error(`fs-virtual:promises.stat(${path})`));
      },

      "writeFile": (/** @type {string} */ path, /** @type {string} */ data) => {
        path = normalize(path);
        this.files.set(path, data);
      }

    };

    this.access = (/** @type {string} */ path, /** @type {((err: NodeJS.ErrnoException) => void)} */ mode, /** @type {((err: NodeJS.ErrnoException) => void)=} */ callback) => {
      path = normalize(path);
      if (this.files.has(path)) {
        // @ts-ignore
        return (callback || mode)();
      }
      return (callback || mode)(new Error(`fs-virtual:access(${path})`));
    };

    this.lstat = (/** @type {string} */ path, /** @type {((err: NodeJS.ErrnoException | null, dirent: Stats) => void)} */ callback) => {
      path = normalize(path);
      if (this.files.has(path)) {
        return callback(null, stats(path, (this.files.get(path) || "").length, true));
      }
      // @ts-ignore
      return callback(new Error(`fs-virtual:lstat(${path})`));
      // return callback(null, stats(path, true));
    };

    this.readdir = (/** @type {string} */ path, /** @type {((err: NodeJS.ErrnoException | null, names: string[]) => void)} */ options, /** @type {((err: NodeJS.ErrnoException | null, names: string[]) => void)} */ callback) => {
      path = normalize(path);
      /** @type {string[]} */
      const names = [];
      for (const file of this.files.keys()) {
        if (file.startsWith(`${path}/`)) {
          const parts = file.slice(path.length + 1).split("/");
          if ((parts.length === 1) && !names.includes(parts[0])) {
            names.push(parts[0]);
          }
        }
      }
      return (callback || options)(null, names);
    };

    this.readFile = (/** @type {string} */ path, /** @type {NodeJS.BufferEncoding} */ options, /** @type {((err: NodeJS.ErrnoException | null, names: string=[]) => void)} */ callback) => {
      path = normalize(path);
      if (this.files.has(path)) {
        const content = this.files.get(path);
        return callback(null, content);
      }
      return callback(new Error(`fs-virtual:readFile(${path})`));
    };
  }

  static async mirrorDirectory(/** @type {import("../markdownlint-cli2.mjs").FsLike} */ fs, /** @type {string} */ directory, /** @type {import("globby")} */ globby, /** @type {string} */ virtualRoot) {
    const names = await globby.globby(
      "**",
      {
        "cwd": directory
      }
    );
    /** @type {[string, string][]} */
    const files = names.map((name) => [ `${virtualRoot}/${name}`, "hi" ]);
    return files;
  }
}

if (typeof module !== "undefined") {
  module.exports = FsVirtual;
}
