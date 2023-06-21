import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';
import { Writable } from 'stream';

export const lineReader = readline.createInterface({ input: process.stdin, output: process.stdout });
export const prompt = (query: string) => new Promise((resolve) => lineReader.question(query, resolve));

const mutableStdout = new Writable({
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
export const maskPrompt = (query: string): Promise<string> =>
  new Promise((resolve) => {
    var rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
    });
    return rl.question(query, resolve);
  });
