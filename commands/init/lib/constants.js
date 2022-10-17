/**
 * 初始化类型 project 项目 component 组件
 */
const TYPE_PROJECT = "project";
const TYPE_COMPONENT = "component";

/**
 * 模板类型 normal 标准模板 component 自定义模板
 */
const TYPE_TEMPLATE_NORMAL = "normal";
const TYPE_TEMPLATE_CUSTOM = "custom";

/**
 * 可执行命令白名单
 */
const COMMAND_WHITE_LIST = ["npm", "cnpm"];

module.exports = {
  TYPE_PROJECT,
  TYPE_COMPONENT,
  TYPE_TEMPLATE_NORMAL,
  TYPE_TEMPLATE_CUSTOM,
  COMMAND_WHITE_LIST,
};
