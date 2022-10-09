"use strict";

const Command = require("@dorsey-cli-cn/command");
const log = require("@dorsey-cli-cn/log");

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = !!this._cmd.force;
    log.verbose("projectName:", this.projectName);
    log.verbose("force:", this.force);
  }

  exec() {
    console.log("InitCommand exec");
  }
}

function init(argv) {
  // console.log("init", projectName, cmdObject.force, process.env.CLI_TARGET_PATH);
  return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;
