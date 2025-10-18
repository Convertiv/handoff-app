"use strict";
/**
 * Utility exports for the transformers module
 *
 * This module provides organized utility functions for schema processing,
 * HTML manipulation, build configuration, and other common operations.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Schema utilities
__exportStar(require("./schema"), exports);
// HTML utilities
__exportStar(require("./html"), exports);
// Build utilities
__exportStar(require("./build"), exports);
// Module utilities
__exportStar(require("./module"), exports);
// Handlebars utilities
__exportStar(require("./handlebars"), exports);
// Schema loader utilities
__exportStar(require("./schema-loader"), exports);
