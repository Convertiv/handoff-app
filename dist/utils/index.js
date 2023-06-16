/**
 * Generate slug from string
 * @param str
 * @returns
 */
export var slugify = function (str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '-')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
/**
 *  Filters out null values
 * @param value
 * @returns
 */
export var filterOutNull = function (value) { return value !== null; };
/**
 * Filters out undefined vars
 * @param value
 * @returns
 */
export var filterOutUndefined = function (value) { return value !== undefined; };
