// @ts-check

"use strict";

/* eslint-disable jsdoc/no-undefined-types */

/** @typedef {import("fs").Dirent} Dirent */

const dirent = (/** @type {string} */ path, /** @type {boolean} */ directory = false) => {
  const name = path.replace(/^.*\//u, "");
  /** @type {Dirent} */
  return {
    name,
    "isBlockDevice": () => false,
    "isCharacterDevice": () => false,
    "isDirectory": directory ? () => true : () => false,
    "isFIFO": () => false,
    "isFile": directory ? () => false : () => true,
    "isSocket": () => false,
    "isSymbolicLink": () => false,
    "parentPath": ""
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
        const content = this.files.get(path);
        if (content) {
          return Promise.resolve(content);
        }
        return Promise.reject(new Error(`fs-virtual:promises.readFile(${path})`));
      },

      "stat": (/** @type {string} */ path) => {
        path = normalize(path);
        if (this.files.has(path)) {
          return Promise.resolve(dirent(path));
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

    this.lstat = (/** @type {string} */ path, /** @type {((err: NodeJS.ErrnoException | null, dirent: Dirent) => void)} */ callback) => {
      path = normalize(path);
      if (this.files.has(path)) {
        return callback(null, dirent(path, false));
      }
      return callback(null, dirent(path, true));
    };

    this.readdir = (/** @type {string} */ path, /** @type {((err: NodeJS.ErrnoException | null, names: string[]) => void)} */ options, /** @type {((err: NodeJS.ErrnoException | null, names: string[]) => void)} */ callback) => {
      path = normalize(path);
      /** @type {string[]} */
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

    this.readFile = (/** @type {string} */ path, /** @type {NodeJS.BufferEncoding} */ options, /** @type {((err: NodeJS.ErrnoException | null, names: string=[]) => void)} */ callback) => {
      path = normalize(path);
      const content = this.files.get(path);
      if (content) {
        return callback(null, content);
      }
      return callback(new Error(`fs-virtual:readFile(${path})`));
    };
  }

  static async mirrorDirectory(/** @type {import("../markdownlint-cli2.mjs").FsLike} */ fs, /** @type {string} */ directory, /** @type {import("globby")} */ globby, /** @type {string} */ virtualRoot) {
    const names = await globby.globby(
      "**",
      {
        "cwd": directory,
        "dot": true,
        fs
      }
    );
    /** @type {[string, string][]} */
    const files = await Promise.all(
      names.map(
        async (name) => [
          `${virtualRoot}/${name}`,
          await fs.promises.readFile(`${directory}/${name}`, "utf8")
        ]
      )
    );
    return files;
  }
}

if (typeof module !== "undefined") {
  module.exports = FsVirtual;
}
