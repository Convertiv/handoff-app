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
exports.computeFileState = computeFileState;
exports.computeDirectoryState = computeDirectoryState;
exports.statesMatch = statesMatch;
exports.directoryStatesMatch = directoryStatesMatch;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * Computes the current state (mtime, size) of a file
 * @param filePath - Absolute path to the file
 * @returns FileState if file exists, null otherwise
 */
function computeFileState(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stats = yield fs_extra_1.default.stat(filePath);
            if (!stats.isFile()) {
                return null;
            }
            return {
                mtime: stats.mtimeMs,
                size: stats.size,
            };
        }
        catch (_a) {
            return null;
        }
    });
}
/**
 * Computes file states for all files in a directory (recursively)
 * @param dirPath - Absolute path to the directory
 * @param extensions - Optional array of file extensions to include (e.g., ['.hbs', '.html'])
 * @returns Record mapping relative file paths to their states
 */
function computeDirectoryState(dirPath, extensions) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = {};
        try {
            const stats = yield fs_extra_1.default.stat(dirPath);
            if (!stats.isDirectory()) {
                return result;
            }
            const entries = yield fs_extra_1.default.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path_1.default.join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    // Recursively process subdirectories
                    const subDirStates = yield computeDirectoryState(fullPath, extensions);
                    for (const [subPath, state] of Object.entries(subDirStates)) {
                        result[path_1.default.join(entry.name, subPath)] = state;
                    }
                }
                else if (entry.isFile()) {
                    // Check extension filter if provided
                    if (extensions && extensions.length > 0) {
                        const ext = path_1.default.extname(entry.name).toLowerCase();
                        if (!extensions.includes(ext)) {
                            continue;
                        }
                    }
                    const fileState = yield computeFileState(fullPath);
                    if (fileState) {
                        result[entry.name] = fileState;
                    }
                }
            }
        }
        catch (_a) {
            // Directory doesn't exist or can't be read
        }
        return result;
    });
}
/**
 * Compares two file states for equality
 * @param a - First file state (can be null/undefined)
 * @param b - Second file state (can be null/undefined)
 * @returns true if states match, false otherwise
 */
function statesMatch(a, b) {
    if (!a && !b)
        return true;
    if (!a || !b)
        return false;
    return a.mtime === b.mtime && a.size === b.size;
}
/**
 * Compares two records of file states
 * @param cached - Previously cached file states
 * @param current - Current file states
 * @returns true if all states match, false if any differ or files added/removed
 */
function directoryStatesMatch(cached, current) {
    if (!cached && !current)
        return true;
    if (!cached || !current)
        return false;
    const cachedKeys = Object.keys(cached);
    const currentKeys = Object.keys(current);
    // Check if file count differs
    if (cachedKeys.length !== currentKeys.length) {
        return false;
    }
    // Check if any files were added or removed
    const cachedSet = new Set(cachedKeys);
    for (const key of currentKeys) {
        if (!cachedSet.has(key)) {
            return false;
        }
    }
    // Check if any file states changed
    for (const key of cachedKeys) {
        if (!statesMatch(cached[key], current[key])) {
            return false;
        }
    }
    return true;
}
