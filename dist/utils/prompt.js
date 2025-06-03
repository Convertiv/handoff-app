"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskPrompt = exports.prompt = void 0;
const readline_1 = __importDefault(require("readline"));
const prompt = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
});
exports.prompt = prompt;
/**
 * Hide the Prompt
 * @param {string} query
 * @returns
 */
const maskPrompt = (query, showAnswer) => new Promise((resolve) => {
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
                rl.output.write('\x1B[2K\x1B[200D' + query + `${'*'.repeat(rl.line.length)}`);
            }
            else {
                // @ts-ignore
                rl.output.write(stringToWrite);
            }
        }
        return false;
    };
    return rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    });
});
exports.maskPrompt = maskPrompt;
