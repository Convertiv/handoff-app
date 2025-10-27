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
exports.handlebarsPreviewsPlugin = handlebarsPreviewsPlugin;
const fs_extra_1 = __importDefault(require("fs-extra"));
const handlebars_1 = __importDefault(require("handlebars"));
const path_1 = __importDefault(require("path"));
const handlebars_2 = require("../utils/handlebars");
const html_1 = require("../utils/html");
const string_1 = require("../utils/string");
/**
 * Constants for the Handlebars previews plugin
 */
const PLUGIN_CONSTANTS = {
    PLUGIN_NAME: 'vite-plugin-previews',
    SCRIPT_ID: 'script',
    DUMMY_EXPORT: 'export default {}',
    INSPECT_SUFFIX: '-inspect',
    OUTPUT_FORMAT: 'html',
};
/**
 * Processes component instances from documentation and creates preview data
 * @param componentData - Component transformation data
 * @param documentationComponents - Documentation components
 */
function processComponentInstances(componentData, documentationComponents) {
    // Use figmaComponentId if provided, otherwise skip implicit matching
    if (componentData.figmaComponentId) {
        const figmaComponentKey = (0, string_1.slugify)(componentData.figmaComponentId);
        if (documentationComponents[figmaComponentKey]) {
            for (const instance of documentationComponents[figmaComponentKey].instances) {
                const variationId = instance.id;
                const instanceValues = Object.fromEntries(instance.variantProperties);
                componentData.previews[variationId] = {
                    title: variationId,
                    url: '',
                    values: instanceValues,
                };
            }
        }
    }
}
/**
 * Renders a Handlebars template with the given preview data
 * @param template - Handlebars template string
 * @param componentData - Component transformation data
 * @param previewData - Preview data to render
 * @param injectFieldWrappers - Whether to inject field wrappers for inspection
 * @returns Rendered HTML string
 */
function renderHandlebarsTemplate(template, componentData, previewData, injectFieldWrappers) {
    return __awaiter(this, void 0, void 0, function* () {
        // Register Handlebars helpers with current injection state
        (0, handlebars_2.registerHandlebarsHelpers)({ id: componentData.id, properties: componentData.properties || {} }, injectFieldWrappers);
        const context = (0, handlebars_2.createHandlebarsContext)({
            id: componentData.id,
            properties: componentData.properties || {},
            title: componentData.title
        }, previewData);
        const compiled = handlebars_1.default.compile(template)(context);
        return yield (0, html_1.formatHtmlWithWrapper)(compiled);
    });
}
/**
 * Generates preview files for a component variation
 * @param componentId - Component identifier
 * @param previewKey - Preview variation key
 * @param normalHtml - Normal mode HTML
 * @param inspectHtml - Inspect mode HTML
 * @param emitFile - Vite emitFile function
 */
function emitPreviewFiles(componentId, previewKey, normalHtml, inspectHtml, emitFile) {
    emitFile({
        type: 'asset',
        fileName: `${componentId}-${previewKey}.html`,
        source: normalHtml,
    });
    emitFile({
        type: 'asset',
        fileName: `${componentId}-${previewKey}${PLUGIN_CONSTANTS.INSPECT_SUFFIX}.html`,
        source: inspectHtml,
    });
}
/**
 * Handlebars previews plugin factory
 * @param componentData - Component transformation data
 * @param documentationComponents - Documentation components
 * @param handoff - Handoff instance
 * @returns Vite plugin for Handlebars previews
 */
function handlebarsPreviewsPlugin(componentData, documentationComponents, handoff) {
    return {
        name: PLUGIN_CONSTANTS.PLUGIN_NAME,
        apply: 'build',
        resolveId(resolveId) {
            if (resolveId === PLUGIN_CONSTANTS.SCRIPT_ID) {
                return resolveId;
            }
        },
        load(loadId) {
            if (loadId === PLUGIN_CONSTANTS.SCRIPT_ID) {
                return PLUGIN_CONSTANTS.DUMMY_EXPORT;
            }
        },
        generateBundle() {
            return __awaiter(this, void 0, void 0, function* () {
                const componentId = componentData.id;
                const templatePath = path_1.default.resolve(componentData.entries.template);
                const templateContent = yield fs_extra_1.default.readFile(templatePath, 'utf8');
                // Ensure components object exists
                if (!documentationComponents) {
                    documentationComponents = {};
                }
                // Process component instances from documentation
                processComponentInstances(componentData, documentationComponents);
                const generatedPreviews = {};
                // Generate previews for each variation
                for (const previewKey in componentData.previews) {
                    const previewData = componentData.previews[previewKey];
                    // Render both normal and inspect modes
                    const normalModeHtml = yield renderHandlebarsTemplate(templateContent, componentData, previewData, false);
                    const inspectModeHtml = yield renderHandlebarsTemplate(templateContent, componentData, previewData, true);
                    // Emit preview files
                    emitPreviewFiles(componentId, previewKey, normalModeHtml, inspectModeHtml, (file) => this.emitFile(file));
                    generatedPreviews[previewKey] = normalModeHtml;
                    componentData.previews[previewKey].url = `${componentId}-${previewKey}.html`;
                }
                // Update component data with results
                componentData.format = PLUGIN_CONSTANTS.OUTPUT_FORMAT;
                componentData.preview = '';
                componentData.code = (0, html_1.trimPreview)(templateContent);
                componentData.html = (0, html_1.trimPreview)(generatedPreviews[Object.keys(generatedPreviews)[0]]);
            });
        },
    };
}
