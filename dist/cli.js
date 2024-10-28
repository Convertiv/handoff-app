#! /usr/bin/env node
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var yargs_1 = __importDefault(require("yargs/yargs"));
var helpers_1 = require("yargs/helpers");
var commands_1 = require("./commands");
var HandoffCliError = /** @class */ (function (_super) {
    __extends(HandoffCliError, _super);
    function HandoffCliError(message) {
        var _this = 
        // 'Error' breaks prototype chain here
        _super.call(this, message) || this;
        _this.exitCode = 1;
        _this.messageOnly = false;
        return _this;
    }
    return HandoffCliError;
}(Error));
/**
 * Show the help message
 */
var showVersion = function () {
    return 'Handoff App - 0.14.1';
};
/**
 * Define a CLI error
 * @param msg
 * @param exitCode
 */
var cliError = function (msg, exitCode) {
    if (exitCode === void 0) { exitCode = 1; }
    var err = new HandoffCliError(msg);
    err.messageOnly = true;
    err.exitCode = exitCode;
    throw err;
};
var run = function () {
    try {
        var yargsInstance_1 = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv));
        commands_1.commands.forEach(function (command) {
            yargsInstance_1.command(command);
        });
        yargsInstance_1.help().version(showVersion()).strict().parse();
    }
    catch (e) {
        if (e.message.indexOf('Unknown or unexpected option') === -1)
            throw e;
        return cliError(e.message, 2);
    }
};
run();
