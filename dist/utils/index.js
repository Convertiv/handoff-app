"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterOutUndefined = exports.filterOutNull = exports.slugify = void 0;
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
