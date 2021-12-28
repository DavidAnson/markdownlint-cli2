// @ts-check

"use strict";

module.exports = {
  "names": [ "second-line" ],
  "description": "Rule that reports an error for the second line",
  "tags": [ "test" ],
  "asynchronous": true,
  "function": function rule(params, onError) {
    // Asynchronously report an error for line 2 (if present)
    return new Promise((resolve) => {
      if (params.lines.length >= 2) {
        onError({
          "lineNumber": 2
        });
      }
      resolve();
    });
  }
};
