"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findFilesByExtension = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Recursively finds all files with a given extension in a directory.
 *
 * @param {string} dir - The directory to search.
 * @param {string} extension - The file extension to look for (e.g., '.json', '.txt').
 * @returns {string[]} An array of paths to files with the specified extension.
 */
const findFilesByExtension = (dir, extension) => {
    let results = [];
    // Read the contents of the directory
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        // Construct the full path
        const filePath = path.join(dir, file);
        // Get the file stats (is it a directory or a file?)
        const stat = fs.statSync(filePath);
        // If it's a directory, recurse into it
        if (stat && stat.isDirectory()) {
            results = results.concat((0, exports.findFilesByExtension)(filePath, extension));
        }
        else {
            // If it's a file and it ends with the specified extension, add it to the results
            if (filePath.endsWith(extension)) {
                results.push(filePath);
            }
        }
    });
    return results;
};
exports.findFilesByExtension = findFilesByExtension;
