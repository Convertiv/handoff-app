#! /usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("yargs/helpers");
const yargs_1 = __importDefault(require("yargs/yargs"));
const commands_1 = require("./commands");
class HandoffCliError extends Error {
    constructor(message) {
        // 'Error' breaks prototype chain here
        super(message);
        this.exitCode = 1;
        this.messageOnly = false;
    }
}
/**
 * Show the help message
 */
const showVersion = () => {
    return 'Handoff App - 0.18.0';
};
/**
 * Define a CLI error
 * @param msg
 * @param exitCode
 */
const cliError = function (msg, exitCode = 1) {
    const err = new HandoffCliError(msg);
    err.messageOnly = true;
    err.exitCode = exitCode;
    throw err;
};
const run = () => {
    try {
        const yargsInstance = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv));
        commands_1.commands.forEach((command) => {
            yargsInstance.command(command);
        });
        yargsInstance.help().version(showVersion()).strict().parse();
    }
    catch (e) {
        if (e.message.indexOf('Unknown or unexpected option') === -1)
            throw e;
        return cliError(e.message, 2);
    }
};
run();
