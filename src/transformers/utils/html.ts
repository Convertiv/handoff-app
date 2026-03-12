import { parse } from 'node-html-parser';
import prettier from 'prettier';

/**
 * Trims HTML preview content by extracting body content
 * @param preview - The HTML preview string
 * @returns Trimmed HTML content
 */
export const trimPreview = (preview: string): string => {
  if (typeof preview !== 'string') {
    return '';
  }

  const normalizedPreview = preview.trim();
  if (!normalizedPreview) {
    return '';
  }

  try {
    const bodyEl = parse(normalizedPreview).querySelector('body');
    return bodyEl ? bodyEl.innerHTML.trim() : normalizedPreview;
  } catch {
    // Keep build resilient if parser fails on malformed HTML.
    return normalizedPreview;
  }
};

/**
 * Formats HTML content using Prettier
 * @param html - The HTML content to format
 * @returns Formatted HTML string
 */
export const formatHtml = async (html: string): Promise<string> => {
  return await prettier.format(html, { parser: 'html' });
};

/**
 * Formats HTML content with HTML wrapper using Prettier
 * @param html - The HTML content to format
 * @returns Formatted HTML string with HTML wrapper
 */
export const formatHtmlWithWrapper = async (html: string): Promise<string> => {
  return await prettier.format(`<html lang="en">${html}</html>`, { parser: 'html' });
};
