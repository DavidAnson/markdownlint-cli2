#!/usr/bin/env node

// @ts-check

"use strict";

const { run } = require("./markdownlint-cli2");

run({
  "fixDefault": true
});
