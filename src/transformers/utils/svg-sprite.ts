import { Types as HandoffTypes } from 'handoff-core';

/**
 * Extracts the viewBox attribute from an SVG string
 * @param svgContent - The SVG content as a string
 * @returns The viewBox value or a default
 */
const extractViewBox = (svgContent: string): string => {
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i);
  if (viewBoxMatch) {
    return viewBoxMatch[1];
  }
  
  // Try to extract width/height if no viewBox
  const widthMatch = svgContent.match(/width=["'](\d+)["']/i);
  const heightMatch = svgContent.match(/height=["'](\d+)["']/i);
  
  if (widthMatch && heightMatch) {
    return `0 0 ${widthMatch[1]} ${heightMatch[1]}`;
  }
  
  // Default viewBox
  return '0 0 24 24';
};

/**
 * Extracts the inner content of an SVG (everything between <svg> and </svg>)
 * Also preserves important attributes like fill, stroke, etc.
 * @param svgContent - The SVG content as a string
 * @returns The inner SVG content
 */
const extractSvgInnerContent = (svgContent: string): string => {
  // Match the opening svg tag and capture everything after it until </svg>
  const match = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (match) {
    return match[1].trim();
  }
  return '';
};

/**
 * Extracts fill attribute from the SVG root if present
 * @param svgContent - The SVG content as a string
 * @returns The fill value or undefined
 */
const extractFill = (svgContent: string): string | undefined => {
  const fillMatch = svgContent.match(/<svg[^>]*fill=["']([^"']+)["']/i);
  return fillMatch ? fillMatch[1] : undefined;
};

/**
 * Sanitizes an icon name to be used as an ID
 * Removes file extension and replaces invalid characters
 * @param name - The icon file name/path
 * @returns A sanitized ID string
 */
const sanitizeIconId = (name: string): string => {
  // Remove .svg extension
  let id = name.replace(/\.svg$/i, '');
  
  // Replace spaces and invalid characters with hyphens
  id = id.replace(/[^a-zA-Z0-9-_]/g, '-');
  
  // Remove leading/trailing hyphens
  id = id.replace(/^-+|-+$/g, '');
  
  // Ensure it starts with a letter (prepend 'icon-' if not)
  if (!/^[a-zA-Z]/.test(id)) {
    id = `icon-${id}`;
  }
  
  return id;
};

/**
 * Generates an SVG sprite from an array of icon assets
 * @param icons - Array of icon asset objects containing SVG data
 * @returns The complete SVG sprite as a string
 */
export const generateSvgSprite = (icons: HandoffTypes.IAssetObject[]): string => {
  const symbols: string[] = [];
  
  for (const icon of icons) {
    const svgContent = icon.data;
    
    // Skip if not valid SVG
    if (!svgContent || !svgContent.includes('<svg')) {
      continue;
    }
    
    const id = sanitizeIconId(icon.path);
    const viewBox = extractViewBox(svgContent);
    const innerContent = extractSvgInnerContent(svgContent);
    const fill = extractFill(svgContent);
    
    if (!innerContent) {
      continue;
    }
    
    // Build the symbol element
    const fillAttr = fill ? ` fill="${fill}"` : '';
    const symbol = `  <symbol id="${id}" viewBox="${viewBox}"${fillAttr}>
${innerContent.split('\n').map(line => `    ${line}`).join('\n')}
  </symbol>`;
    
    symbols.push(symbol);
  }
  
  // Build the complete sprite
  const sprite = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none;">
${symbols.join('\n')}
</svg>`;
  
  return sprite;
};

/**
 * Generates a manifest/map of icon IDs for easy reference
 * @param icons - Array of icon asset objects
 * @returns Object mapping icon IDs to their original paths
 */
export const generateSpriteManifest = (icons: HandoffTypes.IAssetObject[]): Record<string, { path: string; name: string }> => {
  const manifest: Record<string, { path: string; name: string }> = {};
  
  for (const icon of icons) {
    if (!icon.data || !icon.data.includes('<svg')) {
      continue;
    }
    
    const id = sanitizeIconId(icon.path);
    manifest[id] = {
      path: icon.path,
      name: icon.name || icon.path.replace(/\.svg$/i, ''),
    };
  }
  
  return manifest;
};
