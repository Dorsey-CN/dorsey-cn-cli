"use strict";

const semverGte = require("semver/functions/gte");
const colors = require("colors");
const log = require("@dorsey-cli-cn/log");

const LOWEST_NODE_VERSION = "14.0.0";

class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error("参数不能为空");
    }
    if (!Array.isArray(argv)) {
      throw new Error("参数必须为数组");
    }
    if (argv.length < 1) {
      throw new Error("参数列表不能为空");
    }
    // console.log(argv);
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.init());
      chain = chain.then(() => this.exec());
      chain.catch((err) => {
        log.error(err.message);
      });
    });
  }

  // 检查当前node版本
  checkNodeVersion() {
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    if (!semverGte(currentVersion, lowestVersion)) {
      throw new Error(
        colors.red(`dorsey-cli 要求node版本必须高于 v${lowestVersion} 版本`)
      );
    }
  }

  // 初始化处理命令行参数
  initArgs() {
    this._cmd = {
      ...this._argv[this._argv.length - 1],
      ...(this._argv[1] || {}),
    };
    this._argv = this._argv.slice(0, this._argv.length - 1);
  }

  init() {
    throw new Error("必须在子类里面实现init方法");
  }

  exec() {
    throw new Error("必须在子类里面实现exec方法");
  }
}

module.exports = Command;
