"use strict";

const path = require("path");

function pathFormat(p) {
  if (p && typeof p === "string") {
    return p.replace(/\\/g, "/");
  }
  return p;
}

module.exports = pathFormat;
