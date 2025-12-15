"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssrRenderPlugin = exports.handlebarsPreviewsPlugin = void 0;
// Export the main plugins
var handlebars_previews_1 = require("./plugins/handlebars-previews");
Object.defineProperty(exports, "handlebarsPreviewsPlugin", { enumerable: true, get: function () { return handlebars_previews_1.handlebarsPreviewsPlugin; } });
var ssr_render_1 = require("./plugins/ssr-render");
Object.defineProperty(exports, "ssrRenderPlugin", { enumerable: true, get: function () { return ssr_render_1.ssrRenderPlugin; } });
