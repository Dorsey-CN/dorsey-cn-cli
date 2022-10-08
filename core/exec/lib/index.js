"use strict";

const path = require("path");
const os = require("os");
const Package = require("@dorsey-cli-cn/package");
const log = require("@dorsey-cli-cn/log");

// 命令name与脚手架包名name映射表
const SETTINGS = {
  // init: "@dorsey-cli-cn/init",
  init: "@imooc-cli/init",
};

const CACHE_DIR = "dependencies";

async function exec() {
  const userHome = os.homedir();
  const homePath = process.env.CLI_HOME_PATH;
  let targetPath = process.env.CLI_TARGET_PATH;
  let storeDir = "";
  // 此处的pkgName最好要通过命令name通过接口获取，下面处理是降级处理
  const pkgName = SETTINGS[arguments[arguments.length - 1].name()];
  const pkgVersion = "latest";
  let pkg;

  // 如果targetPath不存在
  if (!targetPath) {
    targetPath = path.resolve(userHome, homePath, CACHE_DIR);
    storeDir = path.resolve(targetPath, "node_modules");
    pkg = new Package({
      targetPath,
      storeDir,
      pkgName,
      pkgVersion,
    });
    const packageExist = await pkg.exist();
    console.log(packageExist);
    if (!packageExist) {
      await pkg.install();
    } else {
      await pkg.update();
    }
  } else {
    pkg = new Package({
      targetPath,
      pkgName,
      pkgVersion,
    });
  }
  const rootFile = pkg.getRootFilePath();
  log.verbose(rootFile);
  if (rootFile) require(rootFile).apply(null, arguments);
}

module.exports = exec;
