// @ts-check

"use strict";

/* eslint-disable jsdoc/no-undefined-types */

/** @typedef {import("fs").Dirent} Dirent */
/** @typedef {import("fs").Stats} Stats */

const baseFsFunctions = (/** @type {boolean} */ isDirectory) => ({
  "isBlockDevice": () => false,
  "isCharacterDevice": () => false,
  "isDirectory": () => isDirectory,
  "isFIFO": () => false,
  "isFile": () => !isDirectory,
  "isSocket": () => false,
  "isSymbolicLink": () => false
});

/**
 * Returns an fs.Dirent for a path.
 * @param {string} path File/directory path.
 * @param {boolean} isDirectory True iff a directory.
 * @returns {Dirent} fs.Dirent.
 */
const dirent = (path, isDirectory) => {
  const segments = path.split("/");
  // eslint-disable-next-line unicorn/prefer-at
  const name = segments[segments.length - 1];
  const parentPath = segments.slice(0, -1).join("/") || "/";
  return {
    ...baseFsFunctions(isDirectory),
    name,
    parentPath
  };
};

/**
 * Returns an fs.Stats for a path.
 * @param {boolean} isDirectory True iff a directory.
 * @param {string} [data] File data.
 * @returns {Stats} fs.Stats.
 */
const stats = (isDirectory, data) => {
  const size = data?.length || 0;
  const date = new Date(0);
  return {
    ...baseFsFunctions(isDirectory),
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
  constructor(/** @type {[string, string][]=} */ initialFiles) {

    this.files = new Map();
    this.dirs = new Set();

    this.updateFiles = (/** @type {[string, string][]} */ files) => {
      for (const [ path, data ] of files) {
        this.files.set(path, data);
        let dir = path;
        while ((dir = dir.replace(/\/[^/]+$/u, ""))) {
          this.dirs.add(dir);
        }
      }
    };

    this.updateFiles(initialFiles || []);

    this.promises = {

      "access": (/** @type {string} */ path) => {
        path = normalize(path);
        if (this.files.has(path)) {
          return Promise.resolve();
        }
        return Promise.reject(new Error(`fs-virtual:promises.access(${path})`));
      },

      // eslint-disable-next-line no-unused-vars
      "readFile": (/** @type {string} */ path, /** @type {NodeJS.BufferEncoding=} */ options) => {
        path = normalize(path);
        if (this.files.has(path)) {
          return Promise.resolve(this.files.get(path));
        }
        return Promise.reject(new Error(`fs-virtual:promises.readFile(${path})`));
      },

      "stat": (/** @type {string} */ path) => {
        path = normalize(path);
        if (this.files.has(path)) {
          return Promise.resolve(stats(false, this.files.get(path)));
        } else if (this.dirs.has(path)) {
          return Promise.resolve(stats(true));
        }
        return Promise.reject(new Error(`fs-virtual:promises.stat(${path})`));
      },

      // eslint-disable-next-line no-unused-vars
      "writeFile": (/** @type {string} */ path, /** @type {string} */ data, /** @type {NodeJS.BufferEncoding=} */ options) => {
        path = normalize(path);
        this.files.set(path, data);
      }

    };

    this.access = (/** @type {string} */ path, /** @type {((err: NodeJS.ErrnoException) => void)} */ mode, /** @type {((err: NodeJS.ErrnoException) => void)=} */ callback) => {
      // @ts-ignore
      this.promises.access(path).then(callback || mode).catch(callback || mode);
    };

    this.lstat = (/** @type {string} */ path, /** @type {((err: NodeJS.ErrnoException | null, stats: Stats) => void)} */ callback) => {
      // @ts-ignore
      this.promises.stat(path).then((result) => callback(null, result)).catch(callback);
    };

    this.readdir = (/** @type {string} */ path, /** @type {{ "withFileTypes": boolean}=} */ options, /** @type {((err: NodeJS.ErrnoException | null, names: (string | Dirent)[]) => void)} */ callback) => {
      path = normalize(path).replace(/(?<!\/)$/u, "/");
      /** @type {string[]} */
      const names = [];
      const results = [];
      for (const file of this.files.keys()) {
        if (file.startsWith(path)) {
          const [ name ] = file.slice(path.length).split("/");
          if (!names.includes(name)) {
            names.push(name);
            if (options?.withFileTypes) {
              const item = `${path}${name}`;
              const isDirectory = !this.files.has(item);
              results.push(dirent(item, isDirectory));
            } else {
              results.push(name);
            }
          }
        }
      }
      return (callback || options)(null, results);
    };

    this.readFile = (/** @type {string} */ path, /** @type {NodeJS.BufferEncoding} */ options, /** @type {((err: NodeJS.ErrnoException | null, data: string=[]) => void)} */ callback) => {
      this.promises.readFile(path, options).then((result) => callback(null, result)).catch(callback);
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
    names.sort();
    /** @type {[string, string][]} */
    const files = await Promise.all(
      names.map(
        async (name) => [
          `${virtualRoot}/${name}`,
          await fs.promises.readFile(`${directory === "/" ? "" : directory}/${name}`, "utf8").catch(() => "[DELETED FILE]")
        ]
      )
    );
    return files;
  }
}

if (typeof module !== "undefined") {
  module.exports = FsVirtual;
}
