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
const dotenv = require("dotenv");
const commander = require("commander");
const { getNpmSemverVersion } = require("@dorsey-cli-cn/get-npm-info");
const exec = require("@dorsey-cli-cn/exec");

const pkg = require("../package.json");
const contants = require("./constants");

const userHome = os.homedir();
const program = new commander.Command();
const programOptions = program.opts();

// 入口主函数
async function core() {
  try {
    await cliPrepare();
    registerCommand();
  } catch (errMsg) {
    log.error(errMsg);
  }
}

// 脚手架准备阶段
async function cliPrepare() {
  checkPkgVersion();
  checkNodeVersion();
  checkRoot();
  checkUserHome();
  checkEnv();
  await checkGlobalUpdate();
}

// 命令注册
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage("<command> [options]")
    .version(pkg.version)
    .option("-d, --debug", "是否开启调试模式", false)
    .option("-tp, --targetPath <targetPath>", "是否指定本地调试文件路径", "");

  program
    .command("init [projectName]")
    .description("项目初始化创建")
    .option("-f, --force", "是否强制创建项目", false)
    .action(exec);

  // 处理debug模式
  program.on("option:debug", function () {
    process.env.LOG_LEVERL = programOptions.debug ? "verbose" : "info";
    log.level = process.env.LOG_LEVERL;
  });

  // 缓存本地调试文件路径到环境变量
  program.on("option:targetPath", function () {
    process.env.CLI_TARGET_PATH = programOptions.targetPath || "";
  });

  // 处理未知命令
  program.on("command:*", function (obj) {
    console.log(colors.red(`命令 <${obj[0]}>不存在，请检查后重新输入`));
    const availableCommands = program.commands.map((command) => command.name());
    if (availableCommands.length > 0) {
      console.log(colors.red(`可用的命令为: ${availableCommands.join(", ")}`));
    }
  });
  program.parse(process.argv);

  // 如果未输入命令则输出帮助文档
  if (program.args && program.args.length < 1) {
    program.outputHelp();
    console.log();
  }
}

// 检查全局依赖是否要更新
async function checkGlobalUpdate() {
  const pkgName = pkg.name;
  const pkgVersion = pkg.version;
  const lastVersion = await getNpmSemverVersion(pkgName, pkgVersion);
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
      `CLI_HOME_PATH="${createDefaultConfig().cliFileName}"`
    );
  }
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    });
  }
  process.env.CLI_HOME_PATH =
    process.env.CLI_HOME_PATH || contants.DEFAULT_CLI_HOME;
}

// 创建默认环境变量参数
function createDefaultConfig() {
  const cliConfig = {
    cliFileName: process.env.CLI_HOME_PATH || contants.DEFAULT_CLI_HOME,
    cliHome: "",
  };
  cliConfig.cliHome = path.join(userHome, cliConfig.cliFileName);
  return cliConfig;
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
