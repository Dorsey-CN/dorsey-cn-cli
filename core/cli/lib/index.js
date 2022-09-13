"use strict";

const os = require("os");
const path = require("path");
const fs = require("fs");
const log = require("@dorsey-cli-cn/log");
const semverGte = require("semver/functions/gte");
const semverGt = require("semver/functions/gt");
const colors = require("colors");
const rootCheck = require("root-check");
const pathExists = require("path-exists").sync;
const minimist = require("minimist");
const dotenv = require("dotenv");
const { getNpmSemverVersion } = require("@dorsey-cli-cn/get-npm-info");

const pkg = require("../package.json");
const contants = require("./constants");

const userHome = os.homedir();
let args;

// 入口主函数
function core(argv) {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    checkInputArgs(argv);
    checkEnv();
    checkGlobalUpdate();
  } catch (errMsg) {
    log.error(errMsg);
  }
}

// 检查全局依赖是否要更新
async function checkGlobalUpdate() {
  const pkgName = pkg.name;
  const pkgVersion = pkg.version;
  const lastVersion = await getNpmSemverVersion(pkgName, pkgVersion);
  console.log(lastVersion, pkgVersion);
  if (lastVersion && semverGt(lastVersion, pkgVersion)) {
    log.warn(
      "版本更新",
      `请手动更新 ${pkgName}，当前版本为 ${pkgVersion}，最新版本为 ${lastVersion}
    更新命令：npm install -g ${pkgName}`
    );
  }
}

// 检测环境变量
function checkEnv() {
  const dotenvPath = path.resolve(userHome, ".env");
  if (!pathExists(dotenvPath)) {
    fs.writeFileSync(
      dotenvPath,
      `CLI_HOME="${createDefaultConfig().cliFileName}"`
    );
  }
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    });
  }
  console.log(process.env.CLI_HOME);
}

// 创建默认环境变量参数
function createDefaultConfig() {
  const cliConfig = {
    cliFileName: process.env.CLI_HOME || contants.DEFAULT_CLI_HOME,
    cliHome: "",
  };
  cliConfig.cliHome = path.join(userHome, cliConfig.cliFileName);
  return cliConfig;
}

// 检测入参
function checkInputArgs(argv) {
  args = minimist(argv);
  if (args.debug) {
    process.env.LOG_LEVERL = "verbose";
  } else {
    process.env.LOG_LEVERL = "info";
  }
  log.level = process.env.LOG_LEVERL;
}

// 检查用户主目录
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error("当前登录用户主目录不存在");
  }
}

// 检查root启动
function checkRoot() {
  rootCheck();
  // console.log(process.geteuid());
}

// 检测node版本
function checkNodeVersion() {
  const currentVersion = process.version;
  const lowestVersion = contants.LOWEST_NODE_VERSION;
  if (!semverGte(currentVersion, lowestVersion)) {
    throw new Error(
      colors.red(`dorey-cli 要求node版本必须高于 v${lowestVersion} 版本`)
    );
  }
  log.info("node_version", process.version);
}

// 检查应用版本
function checkPkgVersion() {
  log.notice("version", pkg.version);
}

module.exports = core;
