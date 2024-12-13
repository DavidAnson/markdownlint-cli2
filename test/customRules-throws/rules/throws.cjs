// @ts-check

"use strict";

module.exports = {
  "names": [ "throws" ],
  "description": "Rule that throws during execution",
  "tags": [ "test" ],
  "function": function rule(params, onError) {
    throw new Error("Simulated bug");
  }
};
