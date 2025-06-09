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
exports.ssrRenderPlugin = exports.handlebarsPreviewsPlugin = void 0;
const esbuild_1 = __importDefault(require("esbuild"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const handlebars_1 = __importDefault(require("handlebars"));
const node_html_parser_1 = require("node-html-parser");
const path_1 = __importDefault(require("path"));
const prettier_1 = __importDefault(require("prettier"));
const react_1 = __importDefault(require("react"));
const server_1 = __importDefault(require("react-dom/server"));
const vite_1 = require("vite");
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
                    });
                    return yield prettier_1.default.format(compiled, { parser: 'html' });
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
exports.handlebarsPreviewsPlugin = handlebarsPreviewsPlugin;
function buildAndEvaluateModule(entryPath, handoff) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        // Default esbuild configuration
        const defaultBuildConfig = {
            entryPoints: [entryPath],
            bundle: true,
            write: false,
            format: 'cjs',
            platform: 'node',
            jsx: 'automatic',
            external: ['react', 'react-dom'],
        };
        // Apply user's SSR build config hook if provided
        const buildConfig = ((_b = (_a = handoff === null || handoff === void 0 ? void 0 : handoff.config) === null || _a === void 0 ? void 0 : _a.hooks) === null || _b === void 0 ? void 0 : _b.ssrBuildConfig) ? handoff.config.hooks.ssrBuildConfig(defaultBuildConfig) : defaultBuildConfig;
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
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            return __awaiter(this, void 0, void 0, function* () {
                // Delete all JS chunks
                for (const [fileName, chunkInfo] of Object.entries(bundle)) {
                    if (chunkInfo.type === 'chunk' && fileName.includes('script')) {
                        delete bundle[fileName];
                    }
                }
                const id = data.id;
                const entry = path_1.default.resolve(data.entries.template);
                // Load schema if schema entry exists
                if ((_a = data.entries) === null || _a === void 0 ? void 0 : _a.schema) {
                    const schemaPath = path_1.default.resolve(data.entries.schema);
                    const ext = path_1.default.extname(schemaPath);
                    if (ext === '.ts' || ext === '.tsx') {
                        // Build and evaluate schema module
                        const schemaMod = yield buildAndEvaluateModule(schemaPath, handoff);
                        // Get schema from exports using hook or default to exports.default
                        const schema = ((_c = (_b = handoff === null || handoff === void 0 ? void 0 : handoff.config) === null || _b === void 0 ? void 0 : _b.hooks) === null || _c === void 0 ? void 0 : _c.getSchemaFromExports)
                            ? handoff.config.hooks.getSchemaFromExports(schemaMod.exports)
                            : schemaMod.exports.default;
                        // Apply schema to properties if schema exists and is valid
                        if ((schema === null || schema === void 0 ? void 0 : schema.type) === 'object') {
                            if ((_e = (_d = handoff === null || handoff === void 0 ? void 0 : handoff.config) === null || _d === void 0 ? void 0 : _d.hooks) === null || _e === void 0 ? void 0 : _e.schemaToProperties) {
                                data.properties = handoff.config.hooks.schemaToProperties(schema);
                            }
                        }
                    }
                }
                // Build and evaluate component module
                const mod = yield buildAndEvaluateModule(entry, handoff);
                const Component = mod.exports.default;
                // Look for exported schema in component file only if no separate schema file was provided
                if (!((_f = data.entries) === null || _f === void 0 ? void 0 : _f.schema)) {
                    // Get schema from exports using hook or default to exports.schema
                    const schema = ((_h = (_g = handoff === null || handoff === void 0 ? void 0 : handoff.config) === null || _g === void 0 ? void 0 : _g.hooks) === null || _h === void 0 ? void 0 : _h.getSchemaFromExports)
                        ? handoff.config.hooks.getSchemaFromExports(mod.exports)
                        : mod.exports.schema;
                    if ((schema === null || schema === void 0 ? void 0 : schema.type) === 'object') {
                        if ((_k = (_j = handoff === null || handoff === void 0 ? void 0 : handoff.config) === null || _j === void 0 ? void 0 : _j.hooks) === null || _k === void 0 ? void 0 : _k.schemaToProperties) {
                            data.properties = handoff.config.hooks.schemaToProperties(schema);
                        }
                    }
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
                    const renderedHtml = server_1.default.renderToString(react_1.default.createElement(Component, data.previews[key].values));
                    // 3. Hydration source: baked-in, references user entry
                    const clientSource = `
          import React from 'react';
          import { hydrateRoot } from 'react-dom/client';
          import Component from '${(0, vite_1.normalizePath)(entry)}';

          const raw = document.getElementById('__APP_PROPS__')?.textContent || '{}';
          const props = JSON.parse(raw);
          hydrateRoot(document.getElementById('root'), <Component {...props} />);
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
                    const clientBuildConfig = ((_m = (_l = handoff === null || handoff === void 0 ? void 0 : handoff.config) === null || _l === void 0 ? void 0 : _l.hooks) === null || _m === void 0 ? void 0 : _m.clientBuildConfig)
                        ? handoff.config.hooks.clientBuildConfig(defaultClientBuildConfig)
                        : defaultClientBuildConfig;
                    const bundledClient = yield esbuild_1.default.build(clientBuildConfig);
                    const inlinedJs = bundledClient.outputFiles[0].text;
                    // 4. Emit fully inlined HTML
                    html = `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <script id="__APP_PROPS__" type="application/json">${JSON.stringify(props)}</script>
            <script type="module">
              ${inlinedJs}
            </script>
          </head>
          <body>
            <div id="root">${renderedHtml}</div>
          </body>
        </html>`;
                    this.emitFile({
                        type: 'asset',
                        fileName: `${id}-${key}.html`,
                        source: `<!DOCTYPE html>
<head>
  <link rel="stylesheet" href="/api/component/shared.css">
  <link rel="stylesheet" href="/api/component/${id}.css">
  <link rel="stylesheet" href="/assets/css/preview.css">
</head>
<body>
  ${pretty}
</body>`,
                    });
                    this.emitFile({
                        type: 'asset',
                        fileName: `${id}-${key}-inspect.html`,
                        source: html,
                    });
                    previews[key] = html;
                    data.previews[key].url = `${id}-${key}.html`;
                }
                html = yield prettier_1.default.format(html, { parser: 'html' });
                data.preview = '';
                data.code = trimPreview(html);
            });
        },
    };
}
exports.ssrRenderPlugin = ssrRenderPlugin;
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
