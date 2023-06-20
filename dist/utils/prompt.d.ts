/// <reference types="node" />
import readline from 'readline';
export declare const lineReader: readline.Interface;
export declare const prompt: (query: string) => Promise<unknown>;
/**
 * Hide the Prompt
 * @param {string} query
 * @returns
 */
export declare const maskPrompt: (query: string) => Promise<string>;
