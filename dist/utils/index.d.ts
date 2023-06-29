/**
 * Generate slug from string
 * @param str
 * @returns
 */
export declare const slugify: (str: string) => string;
/**
 *  Filters out null values
 * @param value
 * @returns
 */
export declare const filterOutNull: <T>(value: T) => value is NonNullable<T>;
/**
 * Filters out undefined vars
 * @param value
 * @returns
 */
export declare const filterOutUndefined: <T>(value: T) => value is NonNullable<T>;
