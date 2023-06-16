import readline from 'readline';
import { Writable } from 'stream';
export var lineReader = readline.createInterface({ input: process.stdin, output: process.stdout });
export var prompt = function (query) { return new Promise(function (resolve) { return lineReader.question(query, resolve); }); };
var mutableStdout = new Writable({
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
export var maskPrompt = function (query) {
    return new Promise(function (resolve) {
        var rl = readline.createInterface({
            input: process.stdin,
            output: mutableStdout,
        });
        return rl.question(query, resolve);
    });
};
