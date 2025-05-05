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
exports.buildMainCss = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const vite_1 = require("vite");
const index_1 = require("../../../index");
const config_1 = __importDefault(require("../../config"));
const component_1 = require("../component");
/**
 * Builds a CSS bundle using Vite
 *
 * @param options - The options object
 * @param options.entry - The entry file path for the bundle
 * @param options.outputPath - The directory where the bundle will be output
 * @param options.outputFilename - The name of the output file
 * @param options.loadPaths - Array of paths for SASS to look for imports
 * @param options.handoff - The Handoff configuration object
 */
const buildCssBundle = ({ entry, outputPath, outputFilename, loadPaths, handoff }) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Store the current NODE_ENV value
    const oldNodeEnv = process.env.NODE_ENV;
    console.log('WHAT IS THIS', entry, outputPath, outputFilename);
    try {
        let viteConfig = Object.assign(Object.assign({}, config_1.default), { build: Object.assign(Object.assign({}, config_1.default.build), { outDir: outputPath, emptyOutDir: false, minify: false, rollupOptions: {
                    input: {
                        style: entry
                    },
                    output: {
                        assetFileNames: (assetInfo) => {
                            if (assetInfo.name === 'style.css') {
                                return outputFilename;
                            }
                            return assetInfo.name;
                        }
                    }
                } }), css: {
                preprocessorOptions: {
                    scss: {
                        includePaths: loadPaths,
                        quietDeps: true,
                        // Maintain compatibility with older sass imports
                        importer: [(url) => {
                                if (url.startsWith('~')) {
                                    return { file: url.slice(1) };
                                }
                                return null;
                            }],
                        // Use modern API settings
                        api: 'modern',
                        silenceDeprecations: ["import", "legacy-js-api"],
                    }
                }
            } });
        // Allow configuration to be modified through hooks
        if ((_b = (_a = handoff === null || handoff === void 0 ? void 0 : handoff.config) === null || _a === void 0 ? void 0 : _a.hooks) === null || _b === void 0 ? void 0 : _b.cssBuildConfig) {
            viteConfig = handoff.config.hooks.cssBuildConfig(viteConfig);
        }
        yield (0, vite_1.build)(viteConfig);
    }
    finally {
        // Restore the original NODE_ENV value
        if (oldNodeEnv === 'development' || oldNodeEnv === 'production' || oldNodeEnv === 'test') {
            process.env.NODE_ENV = oldNodeEnv;
        }
        else {
            delete process.env.NODE_ENV;
        }
    }
});
const buildComponentCss = (data, handoff, sharedStyles) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e;
    const id = data.id;
    const entry = (_c = data.entries) === null || _c === void 0 ? void 0 : _c.scss;
    if (!entry) {
        return data;
    }
    const extension = path_1.default.extname(entry);
    if (!extension) {
        return data;
    }
    const outputPath = (0, component_1.getComponentOutputPath)(handoff);
    try {
        if (extension === '.scss' || extension === '.css') {
            // Read the original source
            const sourceContent = yield fs_extra_1.default.readFile(entry, 'utf8');
            if (extension === '.scss') {
                data['sass'] = sourceContent;
            }
            // Setup SASS load paths
            const loadPaths = [
                path_1.default.resolve(handoff.workingPath),
                path_1.default.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
                path_1.default.resolve(handoff.workingPath, 'node_modules'),
            ];
            if ((_e = (_d = handoff.integrationObject) === null || _d === void 0 ? void 0 : _d.entries) === null || _e === void 0 ? void 0 : _e.integration) {
                loadPaths.unshift(path_1.default.dirname(handoff.integrationObject.entries.integration));
            }
            yield buildCssBundle({
                entry,
                outputPath,
                outputFilename: `${id}.css`,
                loadPaths,
                handoff
            });
            // Read the built CSS
            const builtCss = yield fs_extra_1.default.readFile(path_1.default.resolve(outputPath, `${id}.css`), 'utf8');
            data['css'] = builtCss;
            // Handle shared styles
            const splitCSS = builtCss.split('/* COMPONENT STYLES*/');
            if (splitCSS && splitCSS.length > 1) {
                data['css'] = splitCSS[1];
                data['sharedStyles'] = splitCSS[0];
                yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, 'shared.css'), data['sharedStyles']);
            }
            else {
                if (!sharedStyles) {
                    sharedStyles = '/* These are the shared styles used in every component. */ \n\n';
                }
                yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, 'shared.css'), sharedStyles);
            }
        }
    }
    catch (e) {
        console.log(chalk_1.default.red(`Error building CSS for ${id}`));
        console.log(e);
        throw e;
    }
    return data;
});
/**
 * Build the main CSS file using Vite
 */
const buildMainCss = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g, _h;
    const outputPath = (0, component_1.getComponentOutputPath)(handoff);
    const integration = (0, index_1.initIntegrationObject)(handoff)[0];
    if (((_f = integration === null || integration === void 0 ? void 0 : integration.entries) === null || _f === void 0 ? void 0 : _f.integration) && fs_extra_1.default.existsSync(integration.entries.integration)) {
        const stat = yield fs_extra_1.default.stat(integration.entries.integration);
        const entryPath = stat.isDirectory()
            ? path_1.default.resolve(integration.entries.integration, 'main.scss')
            : integration.entries.integration;
        if (entryPath === integration.entries.integration || fs_extra_1.default.existsSync(entryPath)) {
            console.log(chalk_1.default.green(`Building main CSS file`));
            try {
                // Setup SASS load paths
                const loadPaths = [
                    path_1.default.resolve(handoff.workingPath),
                    path_1.default.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
                    path_1.default.resolve(handoff.workingPath, 'node_modules'),
                ];
                if ((_h = (_g = handoff.integrationObject) === null || _g === void 0 ? void 0 : _g.entries) === null || _h === void 0 ? void 0 : _h.integration) {
                    loadPaths.unshift(path_1.default.dirname(handoff.integrationObject.entries.integration));
                }
                yield buildCssBundle({
                    entry: entryPath,
                    outputPath,
                    outputFilename: 'main.css',
                    loadPaths,
                    handoff
                });
            }
            catch (e) {
                console.log(chalk_1.default.red(`Error building main CSS`));
                console.log(e);
            }
        }
    }
});
exports.buildMainCss = buildMainCss;
exports.default = buildComponentCss;
