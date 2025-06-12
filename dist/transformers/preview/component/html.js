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
exports.buildPreviews = void 0;
const vite_1 = require("vite");
const config_1 = __importDefault(require("../../config"));
const plugins_1 = require("../../plugins");
const component_1 = require("../component");
/**
 * Builds previews for components using Vite and Handlebars.
 *
 * @param data - The result of transforming component tokens.
 * @param handoff - The Handoff configuration object.
 * @param components - Optional file components object.
 * @returns A promise that resolves to the transformed component tokens result.
 * @throws Will throw an error if the Vite build process fails.
 *
 * @example
 * ```typescript
 * const result = await buildPreviews(transformedData, handoffConfig, fileComponents);
 * ```
 */
const buildPreviews = (data, handoff, components) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (!((_a = data.entries) === null || _a === void 0 ? void 0 : _a.template))
        return data;
    const plugins = [
        ...(config_1.default.plugins || []),
        ...(data.entries.template.includes('.hbs') ? [(0, plugins_1.handlebarsPreviewsPlugin)(data, components, handoff)] : []),
        //...(data.entries.template.includes('.tsx') ? [react(), ssrRenderPlugin(data, components, handoff)] : []),
    ];
    // Store the current NODE_ENV value before vite build
    // This is necessary because viteBuild forcibly sets NODE_ENV to 'production'
    // which can cause issues with subsequent Next.js operations that rely on
    // the original NODE_ENV value
    const oldNodeEnv = process.env.NODE_ENV;
    try {
        let viteConfig = Object.assign(Object.assign({}, config_1.default), { plugins, build: {
                outDir: (0, component_1.getComponentOutputPath)(handoff),
                emptyOutDir: false,
                rollupOptions: {
                    input: { script: 'script' },
                },
            } });
        // Allow configuration to be modified through hooks
        if ((_c = (_b = handoff === null || handoff === void 0 ? void 0 : handoff.config) === null || _b === void 0 ? void 0 : _b.hooks) === null || _c === void 0 ? void 0 : _c.htmlBuildConfig) {
            viteConfig = handoff.config.hooks.htmlBuildConfig(viteConfig);
        }
        yield (0, vite_1.build)(viteConfig);
    }
    catch (error) {
        console.error(`Error building component previews: ${data.entries.template}`, error);
    }
    finally {
        // Restore the original NODE_ENV value after vite build completes
        // This prevents interference with Next.js app building/running processes
        // that depend on the correct NODE_ENV value
        if (oldNodeEnv === 'development' || oldNodeEnv === 'production' || oldNodeEnv === 'test') {
            process.env.NODE_ENV = oldNodeEnv;
        }
        else {
            delete process.env.NODE_ENV;
        }
    }
    return data;
});
exports.buildPreviews = buildPreviews;
exports.default = exports.buildPreviews;
