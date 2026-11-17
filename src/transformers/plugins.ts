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
 * - angularRenderPlugins: Angular ahead-of-time compilation with client rendering
 * - vueRenderPlugins: Vue single-file component compilation with client rendering
 */

// Export the main plugins
export { handlebarsPreviewsPlugin } from './plugins/handlebars-previews';
export { ssrRenderPlugin } from './plugins/ssr-render';
export { csfRenderPlugin } from './plugins/csf-render';
export { angularRenderPlugins } from './plugins/angular-render';
export { vueRenderPlugins } from './plugins/vue-render';

