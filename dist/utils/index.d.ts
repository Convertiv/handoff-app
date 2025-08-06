/**
 * Filters out null values
 * @param value
 * @returns
 */
export declare const filterOutNull: <T>(value: T) => value is NonNullable<T>;
