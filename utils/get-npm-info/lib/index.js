"use strict";

const urlJoin = require("url-join");
const axios = require("axios");
const semverSatisfies = require("semver/functions/satisfies");
const semverGt = require("semver/functions/gt");

/**
 * 根据npm提供的对外接口获取对应依赖库的信息
 * @param {*} name 依赖库名称
 * @param {*} registry 依赖源
 * @returns 依赖库信息
 */
function getNpmInfo(name, registry) {
  if (!name) return null;
  const url = urlJoin(registry || getDefaultREgistry(), name);
  return axios
    .get(url)
    .then((response) => {
      if (response && response.status === 200) {
        return response.data;
      }
      return null;
    })
    .catch((err) => Promise.reject(err));
}

function getDefaultREgistry(isOrigin = true) {
  return isOrigin
    ? "https://registry.npmjs.org"
    : "https://registry.npm.taobao.org";
}

/**
 * 根据返回的依赖信息解析出版本号集合
 * @param {*} name 依赖库名称
 * @param {*} registry 依赖源 默认为npm
 * @returns
 */
async function getNpmVersions(name, registry) {
  const npmInfo = await getNpmInfo(name, registry);
  if (npmInfo && npmInfo.versions) {
    return Object.keys(npmInfo.versions);
  } else {
    return [];
  }
}

/**
 * 获取大于等于当前版本号的版本号集合，并做降序排序
 * @param {*} versions 所有版本号集合
 * @param {*} baseVersion 当前版本号
 * @returns
 */
function getSemverVersions(versions, baseVersion) {
  return versions
    .filter((version) => semverSatisfies(version, `^${baseVersion}`))
    .sort((a, b) => semverGt(a, b));
}

/**
 * 获取已发布的最新版本号
 * @param {*} name 依赖库名称
 * @param {*} baseVersion 当前版本号
 * @param {*} registry 依赖源
 * @returns
 */
async function getNpmSemverVersion(name, baseVersion, registry) {
  const versions = await getNpmVersions(name, registry);
  const newVersions = await getSemverVersions(versions, baseVersion);
  if (newVersions && newVersions.length > 0) {
    return newVersions[newVersions.length - 1];
  }
  return null;
}

/**
 * 获取最新版本号
 * @param {*} name 依赖库名称
 * @param {*} registry 依赖源
 * @returns
 */
async function getNpmLatestVersion(name, registry) {
  const versions = await getNpmVersions(name, registry);
  if (versions && versions.length > 0) {
    return versions.sort((a, b) => semverGt(a, b))[versions.length - 1];
  }

  return null;
}

module.exports = {
  getNpmInfo,
  getNpmSemverVersion,
  getDefaultREgistry,
  getNpmLatestVersion,
};
