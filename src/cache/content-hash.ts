import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '../index';

/**
 * Result of computing a component's content hash
 */
export interface ComponentContentHash {
  /** SHA256 hash of the concatenated source content */
  hash: string;
  /** List of files that were included in the hash computation */
  files: string[];
}

/**
 * Reads file content safely, returning empty string if file doesn't exist
 */
async function readFileContent(filePath: string): Promise<string> {
  try {
    if (await fs.pathExists(filePath)) {
      return await fs.readFile(filePath, 'utf8');
    }
  } catch {
    // File doesn't exist or can't be read
  }
  return '';
}

/**
 * Reads all files in a directory and returns concatenated content
 */
async function readDirectoryContent(dirPath: string, extensions: string[] = ['.hbs', '.html']): Promise<string> {
  let content = '';
  
  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      return content;
    }

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    // Sort entries for consistent ordering
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively process subdirectories
        content += await readDirectoryContent(fullPath, extensions);
      } else if (entry.isFile()) {
        // Check extension filter
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.length === 0 || extensions.includes(ext)) {
          content += await readFileContent(fullPath);
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return content;
}

/**
 * Computes a content hash for a component based on its source files.
 * 
 * The hash is computed from the concatenated contents of:
 * - The component's JSON/JS config file
 * - The template entry file (or all files in template directory)
 * - The SCSS/CSS entry file
 * - The JavaScript entry file
 * 
 * @param handoff - The Handoff instance
 * @param componentId - The component ID to compute hash for
 * @returns ComponentContentHash with the hash and list of included files
 */
export async function computeComponentContentHash(
  handoff: Handoff,
  componentId: string
): Promise<ComponentContentHash> {
  const runtimeComponent = handoff.runtimeConfig?.entries?.components?.[componentId];
  
  if (!runtimeComponent) {
    return { hash: '', files: [] };
  }

  const includedFiles: string[] = [];
  let contentToHash = '';

  // 1. Find and read the component config file (JSON/JS/CJS)
  const configPaths = handoff.getConfigFilePaths();
  for (const configPath of configPaths) {
    // Check if this config path belongs to this component
    if (configPath.includes(componentId)) {
      const configContent = await readFileContent(configPath);
      if (configContent) {
        contentToHash += configContent;
        includedFiles.push(configPath);
      }
      break;
    }
  }

  // 2. Read entry files
  const entries = runtimeComponent.entries as Record<string, string | undefined> | undefined;
  
  if (entries) {
    // Template entry
    const templatePath = entries.template || (entries as Record<string, string>).templates;
    if (templatePath) {
      try {
        const stat = await fs.stat(templatePath);
        if (stat.isDirectory()) {
          // Read all template files in directory
          contentToHash += await readDirectoryContent(templatePath, ['.hbs', '.html', '.tsx']);
          includedFiles.push(`${templatePath}/*`);
        } else {
          const templateContent = await readFileContent(templatePath);
          if (templateContent) {
            contentToHash += templateContent;
            includedFiles.push(templatePath);
          }
        }
      } catch {
        // File/directory doesn't exist
      }
    }

    // SCSS/CSS entry
    if (entries.scss) {
      const styleContent = await readFileContent(entries.scss);
      if (styleContent) {
        contentToHash += styleContent;
        includedFiles.push(entries.scss);
      }
    }

    // JavaScript entry
    if (entries.js) {
      const jsContent = await readFileContent(entries.js);
      if (jsContent) {
        contentToHash += jsContent;
        includedFiles.push(entries.js);
      }
    }
  }

  // Compute SHA256 hash
  const hash = contentToHash
    ? crypto.createHash('sha256').update(contentToHash).digest('hex')
    : '';

  return { hash, files: includedFiles };
}
