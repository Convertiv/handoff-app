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
                data.preview = '';
                data.code = trimPreview(template);
            });
        },
    };
}
exports.handlebarsPreviewsPlugin = handlebarsPreviewsPlugin;
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
            return __awaiter(this, void 0, void 0, function* () {
                // Delete all JS chunks
                for (const [fileName, chunkInfo] of Object.entries(bundle)) {
                    if (chunkInfo.type === 'chunk' && fileName.includes('script')) {
                        delete bundle[fileName];
                    }
                }
                const id = data.id;
                const entry = path_1.default.resolve(data.entries.template);
                // 1. Compile the component to CommonJS in memory
                const ssrBuild = yield esbuild_1.default.build({
                    entryPoints: [entry],
                    bundle: true,
                    write: false,
                    format: 'cjs',
                    platform: 'node',
                    jsx: 'automatic',
                    external: ['react', 'react-dom'],
                });
                // 2. Evaluate the compiled code
                const { text: serverCode } = ssrBuild.outputFiles[0];
                const mod = { exports: {} };
                const func = new Function('require', 'module', 'exports', serverCode);
                func(require, mod, mod.exports);
                const Component = mod.exports.default;
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
                for (const key in data.previews) {
                    const props = { properties: data.previews[key].values };
                    const renderedHtml = server_1.default.renderToString(react_1.default.createElement(Component, { properties: data.previews[key].values }));
                    // 3. Hydration source: baked-in, references user entry
                    const clientSource = `
          import React from 'react';
          import { hydrateRoot } from 'react-dom/client';
          import Component from '${(0, vite_1.normalizePath)(entry)}';

          const raw = document.getElementById('__APP_PROPS__')?.textContent || '{}';
          const props = JSON.parse(raw);
          hydrateRoot(document.getElementById('root'), <Component {...props} />);
        `;
                    const bundledClient = yield esbuild_1.default.build({
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
                        plugins: [
                            {
                                name: 'handoff-resolve-react',
                                setup(build) {
                                    build.onResolve({ filter: /^react$/ }, () => ({
                                        path: path_1.default.join(handoff.modulePath, 'node_modules/react/index.js'),
                                    }));
                                    build.onResolve({ filter: /^react-dom\/client$/ }, () => ({
                                        path: path_1.default.join(handoff.modulePath, 'node_modules/react-dom/client.js'),
                                    }));
                                    build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
                                        path: path_1.default.join(handoff.modulePath, 'node_modules/react/jsx-runtime.js'),
                                    }));
                                },
                            },
                        ],
                    });
                    const inlinedJs = bundledClient.outputFiles[0].text;
                    // 4. Emit fully inlined HTML
                    const fullHtml = `<!DOCTYPE html>
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
                        source: fullHtml,
                    });
                    // TODO: Currently contains the same data as the first emitted file. Should be resolved before release.
                    this.emitFile({
                        type: 'asset',
                        fileName: `${id}-${key}-inspect.html`,
                        source: `<!DOCTYPE html>\n${fullHtml}`,
                    });
                    previews[key] = fullHtml;
                    data.previews[key].url = `${id}-${key}.html`;
                }
                data.preview = '';
                data.code = trimPreview('TEST');
            });
        },
    };
}
exports.ssrRenderPlugin = ssrRenderPlugin;
