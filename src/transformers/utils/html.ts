import { parse } from 'node-html-parser';
import prettier from 'prettier';

/**
 * Trims HTML preview content by extracting body content
 * @param preview - The HTML preview string
 * @returns Trimmed HTML content
 */
export const trimPreview = (preview: string): string => {
  const bodyEl = parse(preview).querySelector('body');
  const code = bodyEl ? bodyEl.innerHTML.trim() : preview;
  return code;
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
