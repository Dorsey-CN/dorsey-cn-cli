const request = require("@dorsey-cli-cn/request");

module.exports = function () {
  return request({
    url: "project/template",
  });
};
