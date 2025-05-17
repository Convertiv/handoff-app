/**
 * Replaces tokens in the given string and returns it
 * @param str
 * @param tokenValMap
 * @param pipe
 * @returns
 */
export function replaceTokens(str: string, tokenValMap: Map<string, string>, pipe?: (token: string, key: string, value: string) => string) {
  return str.replace(/\$\{(.*?)\}/g, (token) => {
    const key = token.substring(2, token.length - 1).toLowerCase();
    const val = tokenValMap.get(key) ?? '';
    return pipe ? pipe(token, key, val) : val;
  });
}

/**
 * Generate slug from string
 * @param str
 * @returns
 */
export const slugify = (str: string): string =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\$\w\s-]/g, '-')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Filters out null values
 * @param value
 * @returns
 */
export const filterOutNull = <T>(value: T): value is NonNullable<T> => value !== null;

/**
 * Filters out undefined vars
 * @param value
 * @returns
 */
export const filterOutUndefined = <T>(value: T): value is NonNullable<T> => value !== undefined;
