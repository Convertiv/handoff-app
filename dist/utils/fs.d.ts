/**
 * Recursively finds all files with a given extension in a directory.
 *
 * @param {string} dir - The directory to search.
 * @param {string} extension - The file extension to look for (e.g., '.json', '.txt').
 * @returns {string[]} An array of paths to files with the specified extension.
 */
export declare const findFilesByExtension: (dir: string, extension: string) => string[];
