import * as fs from 'fs';
import * as path from 'path';

/**
 * Recursively finds all files with a given extension in a directory.
 *
 * @param {string} dir - The directory to search.
 * @param {string} extension - The file extension to look for (e.g., '.json', '.txt').
 * @returns {string[]} An array of paths to files with the specified extension.
 */
export const findFilesByExtension = (dir: string, extension: string): string[] => {
  let results: string[] = [];

  // Read the contents of the directory
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
      // Construct the full path
      const filePath = path.join(dir, file);

      // Get the file stats (is it a directory or a file?)
      const stat = fs.statSync(filePath);

      // If it's a directory, recurse into it
      if (stat && stat.isDirectory()) {
          results = results.concat(findFilesByExtension(filePath, extension));
      } else {
          // If it's a file and it ends with the specified extension, add it to the results
          if (filePath.endsWith(extension)) {
              results.push(filePath);
          }
      }
  });

  return results;
};