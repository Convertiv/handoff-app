"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
class Logger {
    static init(options) {
        if ((options === null || options === void 0 ? void 0 : options.debug) !== undefined) {
            this.debugMode = options.debug;
        }
    }
    static getTimestamp() {
        const now = new Date();
        return chalk_1.default.gray(`[${now.toISOString()}]`);
    }
    static log(message) {
        console.log(`${this.getTimestamp()} ${message}`);
    }
    static info(message) {
        console.log(`${this.getTimestamp()} ${chalk_1.default.cyan(message)}`);
    }
    static success(message) {
        console.log(`${this.getTimestamp()} ${chalk_1.default.green(message)}`);
    }
    static warn(message) {
        console.warn(`${this.getTimestamp()} ${chalk_1.default.yellow(message)}`);
    }
    static error(message, error) {
        console.error(`${this.getTimestamp()} ${chalk_1.default.red(message)}`);
        if (error) {
            console.error(error);
        }
    }
    static debug(message, data) {
        if (this.debugMode) {
            console.log(`${this.getTimestamp()} ${chalk_1.default.gray(`[DEBUG] ${message}`)}`);
            if (data) {
                console.log(data);
            }
        }
    }
}
exports.Logger = Logger;
Logger.debugMode = false;
