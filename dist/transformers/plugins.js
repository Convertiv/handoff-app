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
exports.ssrRenderPlugin = ssrRenderPlugin;
const esbuild_1 = __importDefault(require("esbuild"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const handlebars_1 = __importDefault(require("handlebars"));
const node_html_parser_1 = require("node-html-parser");
const path_1 = __importDefault(require("path"));
const prettier_1 = __importDefault(require("prettier"));
const react_1 = __importDefault(require("react"));
const react_docgen_typescript_1 = require("react-docgen-typescript");
const server_1 = __importDefault(require("react-dom/server"));
const vite_1 = require("vite");
const component_1 = require("./preview/component");
const ensureIds = (properties) => {
    var _a;
    for (const key in properties) {
        properties[key].id = key;
        if ((_a = properties[key].items) === null || _a === void 0 ? void 0 : _a.properties) {
            ensureIds(properties[key].items.properties);
        }
        if (properties[key].properties) {
            ensureIds(properties[key].properties);
        }
    }
    return properties;
};
const convertDocgenToProperties = (docgenProps) => {
    const properties = {};
    for (const prop of docgenProps) {
        const { name, type, required, description, defaultValue } = prop;
        // Convert react-docgen-typescript type to our SlotType enum
        let propType = component_1.SlotType.TEXT;
        if ((type === null || type === void 0 ? void 0 : type.name) === 'boolean') {
            propType = component_1.SlotType.BOOLEAN;
        }
        else if ((type === null || type === void 0 ? void 0 : type.name) === 'number') {
            propType = component_1.SlotType.NUMBER;
        }
        else if ((type === null || type === void 0 ? void 0 : type.name) === 'array') {
            propType = component_1.SlotType.ARRAY;
        }
        else if ((type === null || type === void 0 ? void 0 : type.name) === 'object') {
            propType = component_1.SlotType.OBJECT;
        }
        else if ((type === null || type === void 0 ? void 0 : type.name) === 'function') {
            propType = component_1.SlotType.FUNCTION;
        }
        else if ((type === null || type === void 0 ? void 0 : type.name) === 'enum') {
            propType = component_1.SlotType.ENUM;
        }
        properties[name] = {
            id: name,
            name: name,
            description: description || '',
            generic: '',
            type: propType,
            default: (defaultValue === null || defaultValue === void 0 ? void 0 : defaultValue.value) || undefined,
            rules: {
                required: required || false,
            },
        };
    }
    return properties;
};
/**
 * Validates if a schema object is valid for property conversion
 * @param schema - The schema object to validate
 * @returns True if schema is valid, false otherwise
 */
const isValidSchemaObject = (schema) => {
    return schema &&
        typeof schema === 'object' &&
        schema.type === 'object' &&
        schema.properties &&
        typeof schema.properties === 'object';
};
/**
 * Safely loads schema from module exports
 * @param moduleExports - The module exports object
 * @param handoff - Handoff instance for configuration
 * @param exportKey - The export key to look for ('default' or 'schema')
 * @returns The schema object or null if not found/invalid
 */
const loadSchemaFromExports = (moduleExports, handoff, exportKey = 'default') => {
    var _a, _b;
    try {
        const schema = ((_b = (_a = handoff.config) === null || _a === void 0 ? void 0 : _a.hooks) === null || _b === void 0 ? void 0 : _b.getSchemaFromExports)
            ? handoff.config.hooks.getSchemaFromExports(moduleExports)
            : moduleExports[exportKey];
        return schema;
    }
    catch (error) {
        console.warn(`Failed to load schema from exports (${exportKey}):`, error);
        return null;
    }
};
/**
 * Generates component properties using react-docgen-typescript
 * @param entry - Path to the component/schema file
 * @param handoff - Handoff instance for configuration
 * @returns Generated properties or null if failed
 */
const generatePropertiesFromDocgen = (entry, handoff) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Use root project's tsconfig.json
        const tsconfigPath = path_1.default.resolve(handoff.workingPath, 'tsconfig.json');
        // Check if tsconfig exists
        if (!fs_extra_1.default.existsSync(tsconfigPath)) {
            console.warn(`TypeScript config not found at ${tsconfigPath}, using default configuration`);
        }
        const parser = (0, react_docgen_typescript_1.withCustomConfig)(tsconfigPath, {
            savePropValueAsString: true,
            shouldExtractLiteralValuesFromEnum: true,
            shouldRemoveUndefinedFromOptional: true,
            propFilter: (prop) => {
                if (prop.parent) {
                    return !prop.parent.fileName.includes('node_modules');
                }
                return true;
            },
        });
        const docgenResults = parser.parse(entry);
        if (docgenResults.length > 0) {
            const componentDoc = docgenResults[0];
            if (componentDoc.props && Object.keys(componentDoc.props).length > 0) {
                return convertDocgenToProperties(Object.values(componentDoc.props));
            }
        }
        return null;
    }
    catch (error) {
        console.warn(`Failed to generate docs with react-docgen-typescript for ${entry}:`, error);
        return null;
    }
});
const trimPreview = (preview) => {
    const bodyEl = (0, node_html_parser_1.parse)(preview).querySelector('body');
    const code = bodyEl ? bodyEl.innerHTML.trim() : preview;
    return code;
};
function handlebarsPreviewsPlugin(data, components, handoff) {
    return {
        name: 'vite-plugin-previews',
        apply: 'build',
        resolveId(id) {
            if (id === 'script') {
                return id;
            }
        },
        load(id) {
            if (id === 'script') {
                return 'export default {}'; // dummy minimal entry
            }
        },
        generateBundle() {
            return __awaiter(this, void 0, void 0, function* () {
                const id = data.id;
                const templatePath = path_1.default.resolve(data.entries.template);
                const template = yield fs_extra_1.default.readFile(templatePath, 'utf8');
                let injectFieldWrappers = false;
                // Common Handlebars helpers
                handlebars_1.default.registerHelper('field', function (field, options) {
                    if (injectFieldWrappers) {
                        if (!field) {
                            console.error(`Missing field declaration for ${id}`);
                            return options.fn(this);
                        }
                        let parts = field.split('.');
                        let current = data.properties;
                        for (const part of parts) {
                            if ((current === null || current === void 0 ? void 0 : current.type) === 'object')
                                current = current.properties;
                            else if ((current === null || current === void 0 ? void 0 : current.type) === 'array')
                                current = current.items.properties;
                            current = current === null || current === void 0 ? void 0 : current[part];
                        }
                        if (!current) {
                            console.error(`Undefined field path for ${id}`);
                            return options.fn(this);
                        }
                        return new handlebars_1.default.SafeString(`<span class="handoff-field handoff-field-${(current === null || current === void 0 ? void 0 : current.type) || 'unknown'}" data-handoff-field="${field}" data-handoff="${encodeURIComponent(JSON.stringify(current))}">${options.fn(this)}</span>`);
                    }
                    else {
                        return options.fn(this);
                    }
                });
                handlebars_1.default.registerHelper('eq', function (a, b) {
                    return a === b;
                });
                if (!components)
                    components = {};
                const previews = {};
                const renderTemplate = (previewData, inspect) => __awaiter(this, void 0, void 0, function* () {
                    injectFieldWrappers = inspect;
                    const compiled = handlebars_1.default.compile(template)({
                        style: `<link rel="stylesheet" href="/api/component/shared.css"><link rel="stylesheet" href="/api/component/${id}.css">\n<link rel="stylesheet" href="/assets/css/preview.css">`,
                        script: `<script src="/api/component/${id}.js"></script>\n<script src="/assets/js/preview.js"></script><script>var fields = ${JSON.stringify(data.properties)};</script>`,
                        properties: previewData.values || {},
                        fields: ensureIds(data.properties),
                        title: data.title,
                    });
                    return yield prettier_1.default.format(`<html lang="en">${compiled}</html>`, { parser: 'html' });
                });
                if (components[data.id]) {
                    for (const instance of components[data.id].instances) {
                        const variationId = instance.id;
                        const values = Object.fromEntries(instance.variantProperties);
                        data.previews[variationId] = {
                            title: variationId,
                            url: '',
                            values,
                        };
                    }
                }
                for (const key in data.previews) {
                    const htmlNormal = yield renderTemplate(data.previews[key], false);
                    const htmlInspect = yield renderTemplate(data.previews[key], true);
                    this.emitFile({
                        type: 'asset',
                        fileName: `${id}-${key}.html`,
                        source: htmlNormal,
                    });
                    this.emitFile({
                        type: 'asset',
                        fileName: `${id}-${key}-inspect.html`,
                        source: htmlInspect,
                    });
                    previews[key] = htmlNormal;
                    data.previews[key].url = `${id}-${key}.html`;
                }
                data.format = 'html';
                data.preview = '';
                data.code = trimPreview(template);
                data.html = trimPreview(previews[Object.keys(previews)[0]]);
            });
        },
    };
}
function buildAndEvaluateModule(entryPath, handoff) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        // Default esbuild configuration
        const defaultBuildConfig = {
            entryPoints: [entryPath],
            bundle: true,
            write: false,
            format: 'cjs',
            platform: 'node',
            jsx: 'automatic',
            external: ['react', 'react-dom', '@opentelemetry/api'],
        };
        // Apply user's SSR build config hook if provided
        const buildConfig = ((_b = (_a = handoff.config) === null || _a === void 0 ? void 0 : _a.hooks) === null || _b === void 0 ? void 0 : _b.ssrBuildConfig)
            ? handoff.config.hooks.ssrBuildConfig(defaultBuildConfig)
            : defaultBuildConfig;
        // Compile the module
        const build = yield esbuild_1.default.build(buildConfig);
        const { text: code } = build.outputFiles[0];
        // Evaluate the compiled code
        const mod = { exports: {} };
        const func = new Function('require', 'module', 'exports', code);
        func(require, mod, mod.exports);
        return mod;
    });
}
function ssrRenderPlugin(data, components, handoff) {
    return {
        name: 'vite-plugin-ssr-static-render',
        apply: 'build',
        resolveId(id) {
            console.log('resolveId', id);
            if (id === 'script') {
                return id;
            }
        },
        load(id) {
            if (id === 'script') {
                return 'export default {}'; // dummy minimal entry
            }
        },
        generateBundle(_, bundle) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                // Delete all JS chunks
                for (const [fileName, chunkInfo] of Object.entries(bundle)) {
                    if (chunkInfo.type === 'chunk' && fileName.includes('script')) {
                        delete bundle[fileName];
                    }
                }
                const id = data.id;
                const entry = path_1.default.resolve(data.entries.template);
                const code = fs_extra_1.default.readFileSync(entry, 'utf8');
                // Determine properties using a hierarchical approach
                let properties = null;
                let Component = null;
                // Step 1: Handle separate schema file (if exists)
                if ((_a = data.entries) === null || _a === void 0 ? void 0 : _a.schema) {
                    const schemaPath = path_1.default.resolve(data.entries.schema);
                    const ext = path_1.default.extname(schemaPath);
                    if (ext === '.ts' || ext === '.tsx') {
                        try {
                            const schemaMod = yield buildAndEvaluateModule(schemaPath, handoff);
                            // Get schema from exports.default (separate schema files export as default)
                            const schema = loadSchemaFromExports(schemaMod.exports, handoff, 'default');
                            if (isValidSchemaObject(schema)) {
                                // Valid schema object - convert to properties
                                if ((_c = (_b = handoff.config) === null || _b === void 0 ? void 0 : _b.hooks) === null || _c === void 0 ? void 0 : _c.schemaToProperties) {
                                    properties = handoff.config.hooks.schemaToProperties(schema);
                                }
                            }
                            else if (schema) {
                                // Schema exists but is not a valid schema object (e.g., type/interface)
                                // Use react-docgen-typescript to document the schema file
                                properties = yield generatePropertiesFromDocgen(schemaPath, handoff);
                            }
                        }
                        catch (error) {
                            console.warn(`Failed to load separate schema file ${schemaPath}:`, error);
                        }
                    }
                    else {
                        console.warn(`Schema file has unsupported extension: ${ext}`);
                    }
                }
                // Step 2: Load component and handle component-embedded schema (only if no separate schema)
                if (!((_d = data.entries) === null || _d === void 0 ? void 0 : _d.schema)) {
                    try {
                        const mod = yield buildAndEvaluateModule(entry, handoff);
                        Component = mod.exports.default;
                        // Check for exported schema in component file (exports.schema)
                        const schema = loadSchemaFromExports(mod.exports, handoff, 'schema');
                        if (isValidSchemaObject(schema)) {
                            // Valid schema object - convert to properties
                            if ((_f = (_e = handoff.config) === null || _e === void 0 ? void 0 : _e.hooks) === null || _f === void 0 ? void 0 : _f.schemaToProperties) {
                                properties = handoff.config.hooks.schemaToProperties(schema);
                            }
                        }
                        else if (schema) {
                            // Schema exists but is not a valid schema object (e.g., type/interface)
                            // Use react-docgen-typescript to document the schema
                            properties = yield generatePropertiesFromDocgen(entry, handoff);
                        }
                        else {
                            // No schema found - use react-docgen-typescript to analyze component props
                            properties = yield generatePropertiesFromDocgen(entry, handoff);
                        }
                    }
                    catch (error) {
                        console.warn(`Failed to load component file ${entry}:`, error);
                    }
                }
                // Step 3: Load component for rendering (if not already loaded)
                if (!Component) {
                    try {
                        const mod = yield buildAndEvaluateModule(entry, handoff);
                        Component = mod.exports.default;
                    }
                    catch (error) {
                        console.error(`Failed to load component for rendering: ${entry}`, error);
                        return;
                    }
                }
                // Apply the determined properties
                if (properties) {
                    data.properties = properties;
                }
                if (!components)
                    components = {};
                const previews = {};
                if (components[data.id]) {
                    for (const instance of components[data.id].instances) {
                        const variationId = instance.id;
                        const values = Object.fromEntries(instance.variantProperties);
                        data.previews[variationId] = {
                            title: variationId,
                            url: '',
                            values,
                        };
                    }
                }
                let html = '';
                for (const key in data.previews) {
                    const props = data.previews[key].values;
                    const renderedHtml = server_1.default.renderToString(react_1.default.createElement(Component, Object.assign(Object.assign({}, data.previews[key].values), { block: Object.assign({}, data.previews[key].values) })));
                    const pretty = yield prettier_1.default.format(renderedHtml, { parser: 'html' });
                    // 3. Hydration source: baked-in, references user entry
                    const clientSource = `
          import React from 'react';
          import { hydrateRoot } from 'react-dom/client';
          import Component from '${(0, vite_1.normalizePath)(entry)}';

          const raw = document.getElementById('__APP_PROPS__')?.textContent || '{}';
          const props = JSON.parse(raw);
          hydrateRoot(document.getElementById('root'), <Component {...props} block={props} />);
        `;
                    // Default client-side build configuration
                    const defaultClientBuildConfig = {
                        stdin: {
                            contents: clientSource,
                            resolveDir: process.cwd(),
                            loader: 'tsx',
                        },
                        bundle: true,
                        write: false,
                        format: 'esm',
                        platform: 'browser',
                        jsx: 'automatic',
                        sourcemap: false,
                        minify: false,
                        plugins: [handoffResolveReactEsbuildPlugin(handoff.workingPath, handoff.modulePath)],
                    };
                    // Apply user's client build config hook if provided
                    const clientBuildConfig = ((_h = (_g = handoff.config) === null || _g === void 0 ? void 0 : _g.hooks) === null || _h === void 0 ? void 0 : _h.clientBuildConfig)
                        ? handoff.config.hooks.clientBuildConfig(defaultClientBuildConfig)
                        : defaultClientBuildConfig;
                    const bundledClient = yield esbuild_1.default.build(clientBuildConfig);
                    const inlinedJs = bundledClient.outputFiles[0].text;
                    // 4. Emit fully inlined HTML
                    html = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="stylesheet" href="/api/component/main.css" />
            <link rel="stylesheet" href="/api/component/${id}.css" />
            <link rel="stylesheet" href="/assets/css/preview.css" />
            <script id="__APP_PROPS__" type="application/json">${JSON.stringify(props)}</script>
            <script type="module">
              ${inlinedJs}
            </script>
            <title>${data.previews[key].title}</title>
          </head>
          <body>
            <div id="root">${pretty}</div>
          </body>
        </html>`;
                    this.emitFile({
                        type: 'asset',
                        fileName: `${id}-${key}.html`,
                        source: html,
                    });
                    // TODO: remove this once we have a way to render inspect mode
                    this.emitFile({
                        type: 'asset',
                        fileName: `${id}-${key}-inspect.html`,
                        source: html,
                    });
                    previews[key] = html;
                    data.previews[key].url = `${id}-${key}.html`;
                }
                html = yield prettier_1.default.format(html, { parser: 'html' });
                data.format = 'react';
                data.preview = '';
                data.code = trimPreview(code);
                data.html = trimPreview(html);
            });
        },
    };
}
function resolveModule(id, searchDirs) {
    for (const dir of searchDirs) {
        try {
            const resolved = require.resolve(id, {
                paths: [path_1.default.resolve(dir)],
            });
            return resolved;
        }
        catch (_) {
            // skip
        }
    }
    throw new Error(`Module "${id}" not found in:\n${searchDirs.join('\n')}`);
}
function handoffResolveReactEsbuildPlugin(workingPath, handoffModulePath) {
    const searchDirs = [workingPath, path_1.default.join(handoffModulePath, 'node_modules')];
    return {
        name: 'handoff-resolve-react',
        setup(build) {
            build.onResolve({ filter: /^react$/ }, () => ({
                path: resolveModule('react', searchDirs),
            }));
            build.onResolve({ filter: /^react-dom\/client$/ }, () => ({
                path: resolveModule('react-dom/client', searchDirs),
            }));
            build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
                path: resolveModule('react/jsx-runtime', searchDirs),
            }));
        },
    };
}
