// @ts-check

"use strict";

const path = require("path");

module.exports = {
  "outputFormatters": [
    [
      "../../formatter-json",
      {
        "name": path.resolve(__dirname, "custom-name.json"),
        "spaces": 1
      }
    ],
    [
      "../../formatter-junit",
      {
        "name": path.resolve(__dirname, "custom-name.xml")
      }
    ]
  ]
};
