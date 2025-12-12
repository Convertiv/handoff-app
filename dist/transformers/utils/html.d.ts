/**
 * Trims HTML preview content by extracting body content
 * @param preview - The HTML preview string
 * @returns Trimmed HTML content
 */
export declare const trimPreview: (preview: string) => string;
/**
 * Formats HTML content using Prettier
 * @param html - The HTML content to format
 * @returns Formatted HTML string
 */
export declare const formatHtml: (html: string) => Promise<string>;
/**
 * Formats HTML content with HTML wrapper using Prettier
 * @param html - The HTML content to format
 * @returns Formatted HTML string with HTML wrapper
 */
export declare const formatHtmlWithWrapper: (html: string) => Promise<string>;
