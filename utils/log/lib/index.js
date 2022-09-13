"use strict";

const log = require("npmlog");

log.level = process.env.LOG_LEVERL ? process.env.LOG_LEVERL : "info"; // 判断debug模式
log.heading = "dorsey"; // 修改前缀
log.headingStyle = { bg: "white" }; // 前缀样式
log.addLevel("success", 2000, { fg: "green", bold: true }); // 自定义命令

module.exports = log;
