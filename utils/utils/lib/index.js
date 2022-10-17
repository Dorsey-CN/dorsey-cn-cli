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

function exec(command, args, options = {}) {
  const isWin32 = process.platform === "win32";
  const cmd = isWin32 ? "cmd" : command;
  const cmdArgs = isWin32 ? ["/c"].concat(command, args) : args;
  return require("child_process").spawn(cmd, cmdArgs, options);
}

function execAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const result = exec(command, args, options);
    result.on("error", (e) => {
      reject(e);
      // process.exit(1);
    });
    result.on("exit", (c) => {
      resolve(c);
      // process.exit(c);
    });
  });
}

module.exports = {
  isObject,
  spinnerStart,
  sleep,
  exec,
  execAsync,
};
