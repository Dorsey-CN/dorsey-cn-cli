"use strict";

const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const fse = require("fs-extra");
const semver = require("semver");
const glob = require("glob");
const ejs = require("ejs");
const Command = require("@dorsey-cli-cn/command");
const log = require("@dorsey-cli-cn/log");
const Package = require("@dorsey-cli-cn/package");
const { spinnerStart, sleep, execAsync } = require("@dorsey-cli-cn/utils");
const getProjectTemplate = require("./get-project-template");

const {
  TYPE_PROJECT,
  TYPE_COMPONENT,
  TYPE_TEMPLATE_NORMAL,
  TYPE_TEMPLATE_CUSTOM,
  COMMAND_WHITE_LIST,
} = require("./constants");

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = !!this._cmd.force;
  }

  // 当前是否为空目录
  isDirEmpty(localPath) {
    let fileList = fs.readdirSync(localPath);
    // 过滤掉隐藏目录、文件和缓存目录
    fileList = fileList.filter(
      (file) => !file.startsWith(".") && !file.includes("node_modules")
    );
    return !fileList || fileList.length <= 0;
  }

  // 生成项目模板choices
  createProjectTemplateChoices() {
    return this.projectTemplate.map((item) => ({
      name: item.name,
      value: item.npmName,
    }));
  }

  // 检测命令是否在白名单内，防止恶意命令执行
  checkCommand(command) {
    return COMMAND_WHITE_LIST.includes(command);
  }

  // 命令执行
  async execCommand(command, errorMsg) {
    let res;
    if (command) {
      const commandArray = command.split(" ");
      if (commandArray && commandArray.length > 1) {
        const cmd = commandArray[0];
        if (!this.checkCommand(cmd)) {
          throw new Error(`命令：${cmd}不合法！`);
        }
        const args = commandArray.slice(1);
        res = await execAsync(cmd, args, {
          cwd: process.cwd(),
          stdio: "inherit",
        });
      }
    }
    if (res !== 0) throw new Error(errorMsg);
    return res;
  }

  // ejs渲染
  async ejsRender(optinos) {
    return new Promise((resolve, reject) => {
      const currentDir = process.cwd();
      const projectInfo = this.projectInfo;
      // 调用glob遍历获取当前路径所有符合条件的文件名称
      glob(
        "**",
        {
          cwd: currentDir,
          ignore: optinos.ignore,
          nodir: true,
        },
        (err, files) => {
          if (err) reject(err);
          // 循环对每一个上一步获取到的文件进行ejs'渲染
          Promise.all(
            files.map((file) => {
              return new Promise((resolve1, reject1) => {
                const filePath = path.resolve(currentDir, file);
                ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
                  if (err) reject1(err);
                  fse.writeFileSync(filePath, result);
                  resolve1();
                });
              });
            })
          )
            .then(() => {
              resolve();
            })
            .catch((err) => {
              reject(err);
            });
        }
      );
    });
  }

  // 准备阶段
  async prepare() {
    // 获取项目模板
    const projectTemplate = await getProjectTemplate();
    if (
      !projectTemplate ||
      !Array.isArray(projectTemplate) ||
      projectTemplate.length <= 0
    ) {
      throw new Error("项目模板不存在");
    }
    this.projectTemplate = projectTemplate;
    const localPath = process.cwd() || path.resolve(".");
    // 检测当前文件夹是否为空
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false;
      if (!this.force) {
        // 如果不是强制创建且当前为空目录，提示是否要清空目录创建项目
        ifContinue = (
          await inquirer.prompt({
            type: "confirm",
            name: "ifContinue",
            default: false,
            message: "当前文件夹不为空，是否要继续创建项目？",
          })
        ).ifContinue;
        if (!ifContinue) return null;
      }
      if (this.force || ifContinue) {
        // 是否清空目录强制创建项目
        const { deleteConfirm } = await inquirer.prompt({
          type: "confirm",
          name: "deleteConfirm",
          default: false,
          message: "是否确认清空当前目录下所有文件？",
        });
        if (deleteConfirm) {
          const spinner = spinnerStart("清空目录中...");
          await sleep();
          try {
            fse.emptyDirSync(localPath);
          } catch (err) {
            throw err;
          } finally {
            spinner.stop(true);
          }
        } else {
          return null;
        }
      }
    }

    return this.getProjectInfo();
  }

  // 获取项目基本信息
  async getProjectInfo() {
    let projectInfo = {};
    // 选择创建项目or组件
    const { type } = await inquirer.prompt({
      type: "list",
      name: "type",
      message: "请选择初始化类型",
      default: TYPE_PROJECT,
      choices: [
        {
          name: "项目",
          value: TYPE_PROJECT,
        },
        {
          name: "组件",
          value: TYPE_COMPONENT,
        },
      ],
    });
    if (type === TYPE_PROJECT) {
      const info = await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "请输入项目名称",
          default: this.projectName || "",
          validate: function (v) {
            const rexp =
              /^[a-zA-Z]([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*[a-zA-Z0-9]$/;
            const done = this.async();

            setTimeout(function () {
              if (!rexp.test(v)) {
                done("项目名称输入不合法");
                return;
              }
              done(null, true);
            }, 0);
          },
        },
        {
          type: "input",
          name: "projectVersion",
          message: "请输入项目版本号",
          default: "1.0.0",
          validate: function (v) {
            const done = this.async();

            setTimeout(function () {
              if (!semver.valid(v)) {
                done("版本号输入不合法");
                return;
              }
              done(null, true);
            }, 0);
          },
          filter: (v) => {
            return semver.valid(v) || v;
          },
        },
        {
          type: "list",
          name: "projectTemplate",
          message: "请选择要使用的项目模板",
          choices: this.createProjectTemplateChoices(),
        },
      ]);
      projectInfo = {
        type,
        ...info,
      };
      if (projectInfo.projectName) {
        projectInfo.name = projectInfo.projectName;
        projectInfo.className = require("kebab-case")(
          projectInfo.projectName
        ).replace(/^-/, "");
      }
      if (projectInfo.projectVersion) {
        projectInfo.version = projectInfo.projectVersion;
      }
      this.projectInfo = projectInfo;
    }
    return projectInfo;
  }

  // 模板下载
  async downloadTemplate() {
    const { projectTemplate } = this.projectInfo;
    const templateInfo = this.projectTemplate.find(
      (item) => item.npmName === projectTemplate
    );
    if (templateInfo) {
      this.templateInfo = templateInfo;
      const userHome = os.homedir();
      const CLI_HOME_PATH = process.env.CLI_HOME_PATH || ".dorsey-cli";
      const targetPath = path.resolve(userHome, CLI_HOME_PATH, "template");
      const storeDir = path.resolve(targetPath, "node_modules");
      const { npmName, version } = templateInfo;
      const templateNpm = new Package({
        targetPath,
        storeDir,
        pkgName: npmName,
        pkgVersion: version,
      });
      const isExist = await templateNpm.exist();
      if (!isExist) {
        const spinner = spinnerStart("正在下载模板...");
        await sleep();
        try {
          await templateNpm.install();
        } catch (err) {
          throw err;
        } finally {
          spinner.stop(true);
          if (await templateNpm.exist()) log.success("模板下载成功");
          this.templateNpm = templateNpm;
        }
      } else {
        const spinner = spinnerStart("正在更新模板...");
        await sleep();
        try {
          await templateNpm.update();
        } catch (err) {
          throw err;
        } finally {
          spinner.stop(true);
          if (await templateNpm.exist()) log.success("模板更新成功");
          this.templateNpm = templateNpm;
        }
      }
    }
  }

  // 模板安装
  async installTemplate() {
    if (this.templateInfo) {
      const { type } = this.templateInfo;
      if (!type) {
        this.templateInfo.type = TYPE_TEMPLATE_NORMAL;
      }
      if (type === TYPE_TEMPLATE_NORMAL) {
        await this.installTemplateNormal();
      } else if (type === TYPE_TEMPLATE_CUSTOM) {
        await this.installTemplateCustom();
      } else {
        throw new Error("无法识别项目模板类型");
      }
    } else {
      throw new Error("项目模板信息不能存在");
    }
    await this.ejsRender({
      ignore: ["node_modules/**", "public/**"],
    });
    const { installCommand, startCommand } = this.templateInfo;
    // 依赖安装
    await this.execCommand(installCommand, "依赖安装过程失败！");
    // 启动命令执行
    await this.execCommand(startCommand, "启动命令执行过程失败！");
  }

  // 安装标准模板
  async installTemplateNormal() {
    // 将项目模板拷贝至当前目录
    const tempaltePath = path.resolve(
      this.templateNpm.cacheFilePath,
      "template"
    );
    const currentPath = process.cwd();
    const spinner = spinnerStart("模板安装中...");
    await sleep();
    try {
      fse.ensureDirSync(tempaltePath);
      fse.ensureDirSync(currentPath);
      fse.copySync(tempaltePath, currentPath);
    } catch (err) {
      throw err;
    } finally {
      spinner.stop(true);
      log.success("模板安装成功");
    }
  }

  // 安装自定义模板
  async installTemplateCustom() {
    console.log("install custom");
  }

  async exec() {
    try {
      await this.prepare();
      if (this.projectInfo) {
        log.verbose(this.projectInfo);
        // 下载模板
        await this.downloadTemplate();
        // 安装模板
        await this.installTemplate();
      }
    } catch (err) {
      log.error(err);
      if (process.env.LOG_LEVEL === "verbose") console.log(err);
    }
  }
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;
