"use strict";

const path = require("path");
const os = require("os");
const cp = require("child_process");
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
  if (rootFile) {
    try {
      // 创建子进程，执行command命令
      const args = Array.from(arguments);
      const cmd = args[args.length - 1];
      const o = Object.create(null);
      Object.keys(cmd).forEach((key) => {
        if (
          key === "opts" ||
          (cmd.hasOwnProperty(key) && !key.startsWith("_") && key !== "parent")
        ) {
          o[key] = cmd[key];
        }
      });
      args[args.length - 1] = o;
      const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
      const child = customSpawn("node", ["-e", code], {
        cwd: process.cwd(),
        stdio: "inherit",
      });
      child.on("error", (e) => {
        log.error(e.message);
        process.exit(1);
      });
      child.on("exit", (e) => {
        log.verbose("命令执行成功", e);
        process.exit(e);
      });
    } catch (errMsg) {
      log.error(errMsg);
    }
  }
}

// 自定义执行spawn方法，为了兼容Windows系统
function customSpawn(command, args, options) {
  const isWin32 = process.platform === "win32";
  const cmd = isWin32 ? "cmd" : command;
  const cmdArgs = isWin32 ? ["/c"].concat(args) : args;
  return cp.spawn(cmd, cmdArgs, options || {});
}

module.exports = exec;
