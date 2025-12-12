"use strict";
/**
 * Plugin exports for the transformers module
 *
 * This module provides a centralized interface for all Vite plugins
 * used in the Handoff application. Each plugin is focused on a specific
 * rendering approach and can be easily tested and maintained.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ssrRenderPlugin = exports.handlebarsPreviewsPlugin = void 0;
var handlebars_previews_1 = require("./handlebars-previews");
Object.defineProperty(exports, "handlebarsPreviewsPlugin", { enumerable: true, get: function () { return handlebars_previews_1.handlebarsPreviewsPlugin; } });
var ssr_render_1 = require("./ssr-render");
Object.defineProperty(exports, "ssrRenderPlugin", { enumerable: true, get: function () { return ssr_render_1.ssrRenderPlugin; } });
