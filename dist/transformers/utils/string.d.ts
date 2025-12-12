/**
 * Converts a string into a slugified version for use in URLs, IDs, or anchors.
 *
 * The slugify function transforms the input string as follows:
 *  - Converts all characters to lowercase.
 *  - Trims whitespace from the start and end.
 *  - Replaces all characters that are not alphanumeric, underscores, spaces, hyphens, or dollar signs with a hyphen.
 *  - Converts runs of consecutive spaces, underscores, or hyphens to a single hyphen.
 *  - Removes leading and trailing hyphens.
 *
 * @param str - The input string to be slugified.
 * @returns A slugified version of the input string.
 *
 * @example
 *   slugify("Hello, World!") // returns "hello-world"
 *   slugify("  Some $pecial_VAR ") // returns "some-$pecial-var"
 */
export declare const slugify: (str: string) => string;
