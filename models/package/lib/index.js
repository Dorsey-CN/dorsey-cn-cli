"use strict";

const path = require("path");
const pkgDir = require("pkg-dir").sync;
const npminstall = require("npminstall");
const pathExists = require("path-exists").sync;
const fse = require("fs-extra");
const { isObject } = require("@dorsey-cli-cn/utils");
const pathFormat = require("@dorsey-cli-cn/path-format");
const {
  getDefaultREgistry,
  getNpmLatestVersion,
} = require("@dorsey-cli-cn/get-npm-info");

/**
 * Package类
 */
class Package {
  constructor(options) {
    if (!options) {
      throw new Error("Package类的构造函数参数options不能为空");
      return;
    }
    if (!isObject(options)) {
      throw new Error("Package类的构造函数参数options必须为object类型");
      return;
    }
    console.log(options);
    // package目标路径
    this.targetPath = options.targetPath;
    // 缓存package的路径
    this.storeDir = options.storeDir;
    // package的name
    this.pkgName = options.pkgName;
    // package的version
    this.pkgVersion = options.pkgVersion;
    // package缓存目录前缀
    this.cacheFilePathPrefix = this.pkgName.replace("/", "_");
  }

  // 获取具体某一版本package对应的缓存目录
  getSpecificCacheFilePath(version) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${version}@${this.pkgName.split("/")[0]}`
    );
  }

  // 当前版本package缓存目录
  get cacheFilePath() {
    return this.getSpecificCacheFilePath(this.pkgVersion);
  }

  // 前置处理
  async prepare() {
    if (this.storeDir && !pathExists(this.storeDir)) {
      fse.mkdirpSync(this.storeDir);
    }
    if (this.pkgVersion === "latest") {
      this.pkgVersion = await getNpmLatestVersion(this.pkgName);
    }
  }

  // 是否存在package
  async exist() {
    if (this.storeDir) {
      await this.prepare();
      return pathExists(this.cacheFilePath);
    } else {
      return pathExists(this.targetPath);
    }
  }

  // 安装package
  async install() {
    await this.prepare();
    return npminstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultREgistry(),
      pkgs: [{ name: this.pkgName, version: this.pkgVersion }],
    });
  }

  // 更新package
  async update() {
    await this.prepare();
    // 获取package最新版本号
    const latestPkgVersion = await getNpmLatestVersion(this.pkgName);
    // 获取对应最新版本号的缓存目录
    const latestFilePath = this.getSpecificCacheFilePath(latestPkgVersion);
    // 如果不存在最新版本号对应的缓存目录，则安装最新版本
    if (!pathExists(latestFilePath)) {
      await npminstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultREgistry(),
        pkgs: [{ name: this.pkgName, version: latestPkgVersion }],
      });
      this.pkgVersion = latestPkgVersion;
    }
  }

  // 获取入口文件路径
  getRootFilePath() {
    function _getRootFilePath(targetPath) {
      // 1.找到package.json所在目录
      const pkgRoots = pkgDir(targetPath);
      if (pkgRoots) {
        // 2.获取package.json文件
        const pkgFile = require(path.join(pkgRoots, "package.json"));
        if (pkgFile && pkgFile.main) {
          // 3.根据main属性找到入口文件
          // 4.文件路径兼容性处理（macOS/Windows）
          return pathFormat(path.join(pkgRoots, pkgFile.main));
        }
      }
      return null;
    }

    if (this.storeDir) {
      return _getRootFilePath(tis.cacheFilePath);
    } else {
      return _getRootFilePath(this.targetPath);
    }
  }
}

module.exports = Package;
