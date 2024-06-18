/**
 * Replaces tokens in the given string and returns it
 * @param str
 * @param tokenValMap
 * @param pipe
 * @returns
 */
export function replaceTokens(str, tokenValMap, pipe) {
    return str.replace(/\$\{(.*?)\}/g, function (token) {
        var _a;
        var key = token.substring(2, token.length - 1);
        var val = (_a = tokenValMap.get(key)) !== null && _a !== void 0 ? _a : '';
        return pipe ? pipe(token, key, val) : val;
    });
}
/**
 * Generate slug from string
 * @param str
 * @returns
 */
export var slugify = function (str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\$\w\s-]/g, '-')
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
