"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterOutUndefined = exports.filterOutNull = exports.slugify = exports.replaceTokens = void 0;
/**
 * Replaces tokens in the given string and returns it
 * @param str
 * @param tokenValMap
 * @param pipe
 * @returns
 */
function replaceTokens(str, tokenValMap, pipe) {
    return str.replace(/\$\{(.*?)\}/g, function (token) {
        var _a;
        var key = token.substring(2, token.length - 1);
        var val = (_a = tokenValMap.get(key)) !== null && _a !== void 0 ? _a : '';
        return pipe ? pipe(token, key, val) : val;
    });
}
exports.replaceTokens = replaceTokens;
/**
 * Generate slug from string
 * @param str
 * @returns
 */
var slugify = function (str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '-')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.slugify = slugify;
/**
 *  Filters out null values
 * @param value
 * @returns
 */
var filterOutNull = function (value) { return value !== null; };
exports.filterOutNull = filterOutNull;
/**
 * Filters out undefined vars
 * @param value
 * @returns
 */
var filterOutUndefined = function (value) { return value !== undefined; };
exports.filterOutUndefined = filterOutUndefined;
