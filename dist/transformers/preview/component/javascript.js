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
exports.buildMainJS = exports.buildComponentJs = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const vite_1 = require("vite");
const index_1 = require("../../../index");
const config_1 = __importDefault(require("../../config"));
const component_1 = require("../component");
/**
 * Builds a JavaScript bundle using Vite
 *
 * @param options - The options object
 * @param options.entry - The entry file path for the bundle
 * @param options.outputPath - The directory where the bundle will be output
 * @param options.outputFilename - The name of the output file
 */
const buildJsBundle = ({ entry, outputPath, outputFilename }, handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const absEntryPath = path_1.default.resolve(entry);
    // Store the current NODE_ENV value before vite build
    // This is necessary because viteBuild forcibly sets NODE_ENV to 'production'
    // which can cause issues with subsequent Next.js operations that rely on
    // the original NODE_ENV value
    const oldNodeEnv = process.env.NODE_ENV;
    try {
        let viteConfig = Object.assign(Object.assign({}, config_1.default), { build: Object.assign(Object.assign({}, config_1.default.build), { lib: {
                    entry: absEntryPath,
                    name: path_1.default.basename(outputFilename, '.js'),
                    formats: ['cjs'],
                    fileName: () => outputFilename,
                }, rollupOptions: Object.assign(Object.assign({}, (_a = config_1.default.build) === null || _a === void 0 ? void 0 : _a.rollupOptions), { output: {
                        exports: 'named',
                    } }), outDir: outputPath }) });
        if ((_c = (_b = handoff === null || handoff === void 0 ? void 0 : handoff.config) === null || _b === void 0 ? void 0 : _b.hooks) === null || _c === void 0 ? void 0 : _c.jsBuildConfig) {
            viteConfig = handoff.config.hooks.jsBuildConfig(viteConfig);
        }
        yield (0, vite_1.build)(viteConfig);
    }
    catch (e) {
        console.error(chalk_1.default.red(`Error building ${outputFilename}`), e);
    }
    finally {
        // Restore the original NODE_ENV value after vite build completes
        // This prevents interference with Next.js app building/running processes
        // that depend on the correct NODE_ENV value
        process.env.NODE_ENV = oldNodeEnv;
    }
});
/**
 * Builds the JavaScript file for a single component if it exists.
 * Reads the component JavaScript file, bundles it using the buildJsBundle utility,
 * and adds both the original and compiled JavaScript to the transform result.
 *
 * @param data - The component transformation result containing the component data
 * @param handoff - The Handoff configuration object
 * @returns The updated component transformation result with JavaScript data
 */
const buildComponentJs = (data, handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    const id = data.id;
    const entry = (_d = data.entries) === null || _d === void 0 ? void 0 : _d.js;
    if (!entry)
        return data;
    const outputPath = (0, component_1.getComponentOutputPath)(handoff);
    try {
        const js = yield fs_extra_1.default.readFile(path_1.default.resolve(entry), 'utf8');
        yield buildJsBundle({
            entry,
            outputPath,
            outputFilename: `${id}.js`,
        }, handoff);
        data.js = js;
        const compiled = yield fs_extra_1.default.readFile(path_1.default.resolve(outputPath, `${id}.js`), 'utf8');
        data['jsCompiled'] = compiled;
    }
    catch (e) {
        console.error(`[Component JS Build Error] ${id}:`, e);
    }
    return data;
});
exports.buildComponentJs = buildComponentJs;
/**
 * Builds the main JavaScript bundle for the component preview.
 *
 * This function checks if there's a main JavaScript bundle defined in the integration,
 * and if the file exists, it builds the bundle and outputs it to the component's output path.
 *
 * @param handoff - The Handoff configuration object containing integration settings
 * @returns A Promise that resolves when the build process is complete
 * @throws May throw an error if the build process fails
 */
const buildMainJS = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const outputPath = (0, component_1.getComponentOutputPath)(handoff);
    const integration = (0, index_1.initIntegrationObject)(handoff)[0];
    if (integration && integration.entries.bundle && fs_extra_1.default.existsSync(path_1.default.resolve(integration.entries.bundle))) {
        yield buildJsBundle({
            entry: integration.entries.bundle,
            outputPath,
            outputFilename: 'main.js',
        }, handoff);
    }
});
exports.buildMainJS = buildMainJS;
exports.default = exports.buildComponentJs;
