"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskPrompt = exports.prompt = exports.lineReader = void 0;
var readline_1 = __importDefault(require("readline"));
var stream_1 = require("stream");
exports.lineReader = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
var prompt = function (query) { return new Promise(function (resolve) { return exports.lineReader.question(query, resolve); }); };
exports.prompt = prompt;
var mutableStdout = new stream_1.Writable({
    write: function (chunk, encoding, callback) {
        process.stdout.write(chunk, encoding);
        callback();
    },
});
/**
 * Hide the Prompt
 * @param {string} query
 * @returns
 */
var maskPrompt = function (query) {
    return new Promise(function (resolve) {
        var rl = readline_1.default.createInterface({
            input: process.stdin,
            output: mutableStdout,
        });
        return rl.question(query, resolve);
    });
};
exports.maskPrompt = maskPrompt;
