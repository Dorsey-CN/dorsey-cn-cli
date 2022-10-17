"use strict";

function isObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

// 启动命令行spinner
function spinnerStart(msg, spinnerString = "|/-\\") {
  const Spinner = require("cli-spinner").Spinner;
  const spinner = new Spinner(msg);
  spinner.setSpinnerString(spinnerString);
  spinner.start();
  return spinner;
}

function sleep(timeout = 1000) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

module.exports = {
  isObject,
  spinnerStart,
  sleep,
};
