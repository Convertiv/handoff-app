"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskPrompt = exports.prompt = void 0;
var readline_1 = __importDefault(require("readline"));
var prompt = function (query) { return new Promise(function (resolve) {
    var rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return rl.question(query, function (answer) {
        rl.close();
        return resolve(answer);
    });
}); };
exports.prompt = prompt;
/**
 * Hide the Prompt
 * @param {string} query
 * @returns
 */
var maskPrompt = function (query, showAnswer) {
    return new Promise(function (resolve) {
        var rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        // @ts-ignore
        rl.stdoutMuted = true;
        if (showAnswer) {
            // @ts-ignore
            rl.stdoutMuted = false;
        }
        // @ts-ignore
        rl._writeToOutput = function _writeToOutput(stringToWrite) {
            var match = /\r|\n/.exec(stringToWrite);
            if (!match) {
                // @ts-ignore
                if (rl.stdoutMuted) {
                    // @ts-ignore
                    rl.output.write('\x1B[2K\x1B[200D' + query + "".concat('*'.repeat(rl.line.length)));
                }
                else {
                    // @ts-ignore
                    rl.output.write(stringToWrite);
                }
            }
            return false;
        };
        return rl.question(query, function (answer) {
            rl.close();
            resolve(answer);
        });
    });
};
exports.maskPrompt = maskPrompt;
