"use strict";

function init(projectName, cmdObject) {
  console.log("init", projectName, cmdObject.force, process.env.CLI_TARGET_PATH);
}

module.exports = init;
