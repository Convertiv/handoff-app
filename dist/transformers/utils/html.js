"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatHtmlWithWrapper = exports.formatHtml = exports.trimPreview = void 0;
const node_html_parser_1 = require("node-html-parser");
const prettier_1 = __importDefault(require("prettier"));
/**
 * Trims HTML preview content by extracting body content
 * @param preview - The HTML preview string
 * @returns Trimmed HTML content
 */
const trimPreview = (preview) => {
    const bodyEl = (0, node_html_parser_1.parse)(preview).querySelector('body');
    const code = bodyEl ? bodyEl.innerHTML.trim() : preview;
    return code;
};
exports.trimPreview = trimPreview;
/**
 * Formats HTML content using Prettier
 * @param html - The HTML content to format
 * @returns Formatted HTML string
 */
const formatHtml = (html) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prettier_1.default.format(html, { parser: 'html' });
});
exports.formatHtml = formatHtml;
/**
 * Formats HTML content with HTML wrapper using Prettier
 * @param html - The HTML content to format
 * @returns Formatted HTML string with HTML wrapper
 */
const formatHtmlWithWrapper = (html) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prettier_1.default.format(`<html lang="en">${html}</html>`, { parser: 'html' });
});
exports.formatHtmlWithWrapper = formatHtmlWithWrapper;
