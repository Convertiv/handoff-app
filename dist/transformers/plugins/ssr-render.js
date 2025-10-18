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
exports.ssrRenderPlugin = ssrRenderPlugin;
const esbuild_1 = __importDefault(require("esbuild"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const react_1 = __importDefault(require("react"));
const server_1 = __importDefault(require("react-dom/server"));
const vite_1 = require("vite");
const docgen_1 = require("../docgen");
const build_1 = require("../utils/build");
const html_1 = require("../utils/html");
const module_1 = require("../utils/module");
const schema_loader_1 = require("../utils/schema-loader");
/**
 * Constants for the SSR render plugin
 */
const PLUGIN_CONSTANTS = {
    PLUGIN_NAME: 'vite-plugin-ssr-static-render',
    SCRIPT_ID: 'script',
    DUMMY_EXPORT: 'export default {}',
    ROOT_ELEMENT_ID: 'root',
    PROPS_SCRIPT_ID: '__APP_PROPS__',
    INSPECT_SUFFIX: '-inspect',
};
/**
 * Loads and processes component schema using hierarchical approach
 * @param componentData - Component transformation data
 * @param componentPath - Path to the component file
 * @param handoff - Handoff instance
 * @returns Tuple of [properties, component] or [null, null] if failed
 */
function loadComponentSchemaAndModule(componentData, componentPath, handoff) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        let properties = null;
        let component = null;
        // Step 1: Handle separate schema file (if exists)
        if ((_a = componentData.entries) === null || _a === void 0 ? void 0 : _a.schema) {
            const schemaPath = path_1.default.resolve(componentData.entries.schema);
            properties = yield (0, schema_loader_1.loadSchemaFromFile)(schemaPath, handoff);
        }
        // Step 2: Load component and handle component-embedded schema (only if no separate schema)
        if (!((_b = componentData.entries) === null || _b === void 0 ? void 0 : _b.schema)) {
            try {
                const moduleExports = yield (0, module_1.buildAndEvaluateModule)(componentPath, handoff);
                component = moduleExports.exports.default;
                // Try to load schema from component exports
                properties = yield (0, schema_loader_1.loadSchemaFromComponent)(moduleExports.exports, handoff);
                // If no schema found, use react-docgen-typescript
                if (!properties) {
                    properties = yield (0, docgen_1.generatePropertiesFromDocgen)(componentPath, handoff);
                }
            }
            catch (error) {
                console.warn(`Failed to load component file ${componentPath}:`, error);
            }
        }
        // Step 3: Load component for rendering (if not already loaded)
        if (!component) {
            try {
                const moduleExports = yield (0, module_1.buildAndEvaluateModule)(componentPath, handoff);
                component = moduleExports.exports.default;
            }
            catch (error) {
                console.error(`Failed to load component for rendering: ${componentPath}`, error);
                return [null, null];
            }
        }
        return [properties, component];
    });
}
/**
 * Generates client-side hydration source code
 * @param componentPath - Path to the component file
 * @returns Client-side hydration source code
 */
function generateClientHydrationSource(componentPath) {
    return `
    import React from 'react';
    import { hydrateRoot } from 'react-dom/client';
    import Component from '${(0, vite_1.normalizePath)(componentPath)}';

    const raw = document.getElementById('${PLUGIN_CONSTANTS.PROPS_SCRIPT_ID}')?.textContent || '{}';
    const props = JSON.parse(raw);
    hydrateRoot(document.getElementById('${PLUGIN_CONSTANTS.ROOT_ELEMENT_ID}'), <Component {...props} block={props} />);
  `;
}
/**
 * Generates complete HTML document with SSR content and hydration
 * @param componentId - Component identifier
 * @param previewTitle - Title for the preview
 * @param renderedHtml - Server-rendered HTML content
 * @param clientJs - Client-side JavaScript bundle
 * @param props - Component props as JSON
 * @returns Complete HTML document
 */
function generateHtmlDocument(componentId, previewTitle, renderedHtml, clientJs, props) {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="/api/component/main.css" />
    <link rel="stylesheet" href="/api/component/${componentId}.css" />
    <link rel="stylesheet" href="/assets/css/preview.css" />
    <script id="${PLUGIN_CONSTANTS.PROPS_SCRIPT_ID}" type="application/json">${JSON.stringify(props)}</script>
    <script type="module">
      ${clientJs}
    </script>
    <title>${previewTitle}</title>
  </head>
  <body>
    <div id="${PLUGIN_CONSTANTS.ROOT_ELEMENT_ID}">${renderedHtml}</div>
  </body>
</html>`;
}
/**
 * SSR render plugin factory
 * @param componentData - Component transformation data
 * @param documentationComponents - Documentation components
 * @param handoff - Handoff instance
 * @returns Vite plugin for SSR rendering
 */
function ssrRenderPlugin(componentData, documentationComponents, handoff) {
    return {
        name: PLUGIN_CONSTANTS.PLUGIN_NAME,
        apply: 'build',
        resolveId(resolveId) {
            console.log('resolveId', resolveId);
            if (resolveId === PLUGIN_CONSTANTS.SCRIPT_ID) {
                return resolveId;
            }
        },
        load(loadId) {
            if (loadId === PLUGIN_CONSTANTS.SCRIPT_ID) {
                return PLUGIN_CONSTANTS.DUMMY_EXPORT;
            }
        },
        generateBundle(_, bundle) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                // Remove all JS chunks to prevent conflicts
                for (const [fileName, chunkInfo] of Object.entries(bundle)) {
                    if (chunkInfo.type === 'chunk' && fileName.includes(PLUGIN_CONSTANTS.SCRIPT_ID)) {
                        delete bundle[fileName];
                    }
                }
                const componentId = componentData.id;
                const componentPath = path_1.default.resolve(componentData.entries.template);
                const componentSourceCode = fs_extra_1.default.readFileSync(componentPath, 'utf8');
                // Load component schema and module
                const [schemaProperties, ReactComponent] = yield loadComponentSchemaAndModule(componentData, componentPath, handoff);
                if (!ReactComponent) {
                    console.error(`Failed to load React component for ${componentId}`);
                    return;
                }
                // Apply schema properties if found
                if (schemaProperties) {
                    componentData.properties = schemaProperties;
                }
                // Ensure components object exists
                if (!documentationComponents) {
                    documentationComponents = {};
                }
                const generatedPreviews = {};
                // Process component instances from documentation
                if (documentationComponents[componentId]) {
                    for (const instance of documentationComponents[componentId].instances) {
                        const variationId = instance.id;
                        const instanceValues = Object.fromEntries(instance.variantProperties);
                        componentData.previews[variationId] = {
                            title: variationId,
                            url: '',
                            values: instanceValues,
                        };
                    }
                }
                let finalHtml = '';
                // Generate previews for each variation
                for (const previewKey in componentData.previews) {
                    const previewProps = componentData.previews[previewKey].values;
                    // Server-side render the component
                    const serverRenderedHtml = server_1.default.renderToString(react_1.default.createElement(ReactComponent, Object.assign(Object.assign({}, previewProps), { block: Object.assign({}, previewProps) })));
                    const formattedHtml = yield (0, html_1.formatHtml)(serverRenderedHtml);
                    // Generate client-side hydration code
                    const clientHydrationSource = generateClientHydrationSource(componentPath);
                    // Build client-side bundle
                    const clientBuildConfig = Object.assign(Object.assign({}, build_1.DEFAULT_CLIENT_BUILD_CONFIG), { stdin: {
                            contents: clientHydrationSource,
                            resolveDir: process.cwd(),
                            loader: 'tsx',
                        }, plugins: [(0, build_1.createReactResolvePlugin)(handoff.workingPath, handoff.modulePath)] });
                    // Apply user's client build config hook if provided
                    const finalClientBuildConfig = ((_b = (_a = handoff.config) === null || _a === void 0 ? void 0 : _a.hooks) === null || _b === void 0 ? void 0 : _b.clientBuildConfig)
                        ? handoff.config.hooks.clientBuildConfig(clientBuildConfig)
                        : clientBuildConfig;
                    const bundledClient = yield esbuild_1.default.build(finalClientBuildConfig);
                    const clientBundleJs = bundledClient.outputFiles[0].text;
                    // Generate complete HTML document
                    finalHtml = generateHtmlDocument(componentId, componentData.previews[previewKey].title, formattedHtml, clientBundleJs, previewProps);
                    // Emit preview files
                    this.emitFile({
                        type: 'asset',
                        fileName: `${componentId}-${previewKey}.html`,
                        source: finalHtml,
                    });
                    // TODO: remove this once we have a way to render inspect mode
                    this.emitFile({
                        type: 'asset',
                        fileName: `${componentId}-${previewKey}${PLUGIN_CONSTANTS.INSPECT_SUFFIX}.html`,
                        source: finalHtml,
                    });
                    generatedPreviews[previewKey] = finalHtml;
                    componentData.previews[previewKey].url = `${componentId}-${previewKey}.html`;
                }
                // Format final HTML and update component data
                finalHtml = yield (0, html_1.formatHtml)(finalHtml);
                componentData.format = 'react';
                componentData.preview = '';
                componentData.code = (0, html_1.trimPreview)(componentSourceCode);
                componentData.html = (0, html_1.trimPreview)(finalHtml);
            });
        },
    };
}
