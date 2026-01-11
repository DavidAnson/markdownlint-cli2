// @ts-check

import nodeFs from "node:fs";
import * as globby from "globby";
import FsVirtual from "../webworker/fs-virtual.cjs";

const mockRoot = "/mock";

const getFsMock = async (/** @type {string} */ directory) => {
  const files = await FsVirtual.mirrorDirectory(nodeFs, directory, globby, mockRoot);
  return new FsVirtual(files);
};

export {
  getFsMock,
  mockRoot
};
