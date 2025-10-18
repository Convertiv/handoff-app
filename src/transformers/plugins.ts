/**
 * @fileoverview Main plugins module for the transformers package
 * 
 * This module provides the primary entry point for Vite plugins used in
 * component transformation and preview generation. It exports specialized
 * plugins for different rendering approaches.
 * 
 * Available plugins:
 * - handlebarsPreviewsPlugin: Handlebars-based template rendering
 * - ssrRenderPlugin: React server-side rendering with hydration
 */

// Export the main plugins
export { handlebarsPreviewsPlugin } from './plugins/handlebars-previews';
export { ssrRenderPlugin } from './plugins/ssr-render';

