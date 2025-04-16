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
exports.generateWebpackConfig = exports.bundleJSWebpack = exports.buildClientFiles = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const webpack_1 = __importDefault(require("webpack"));
const index_1 = require("../transformers/integration/index");
const { createFsFromVolume, Volume } = require('memfs');
const buildClientFiles = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    if (!handoff) {
        throw Error('Handoff not initialized');
    }
    const entry = (0, index_1.getIntegrationEntryPoint)(handoff);
    if (!entry) {
        return Promise.resolve('');
    }
    return new Promise((resolve, reject) => {
        const compile = (0, webpack_1.default)((0, exports.generateWebpackConfig)(entry, handoff));
        compile.run((err, stats) => {
            var _a, _b;
            if (err) {
                let error = chalk_1.default.red('Errors encountered trying to build preview styles.') +
                    "\n  The integration sass expects a token that isn't found in your Figma component.\n";
                if (handoff.debug) {
                    error += chalk_1.default.yellow('\n\n---------- Sass Build Error Trace ---------- \n') + err.stack || err;
                }
                else {
                    error += 'Add the --debug flag to see the full error trace\n\n';
                }
                return reject(error);
            }
            if (stats) {
                if (stats.hasErrors()) {
                    let buildErrors = (_a = stats.compilation.errors) === null || _a === void 0 ? void 0 : _a.map((err) => err.message);
                    let error = chalk_1.default.red('Errors encountered trying to build preview styles.') +
                        "\nThe integration sass expects a token that isn't found in your Figma component.\n";
                    if (handoff.debug) {
                        error += chalk_1.default.yellow('\n\n---------- Sass Build Error Trace ---------- \n') + buildErrors;
                    }
                    else {
                        error += 'Add the --debug flag to see the full error trace\n\n';
                    }
                    return reject(error);
                }
                if (stats.hasWarnings()) {
                    let buildWarnings = (_b = stats.compilation.warnings) === null || _b === void 0 ? void 0 : _b.map((err) => err.message);
                    let error = 'Warnings encountered when building preview styles.\n';
                    if (handoff.debug) {
                        error += buildWarnings;
                        console.error(chalk_1.default.yellow(error));
                    }
                }
            }
            compile.close((closeErr) => { });
            return resolve('Preview styles successfully built.');
        });
    });
});
exports.buildClientFiles = buildClientFiles;
const bundleJSWebpack = (target, handoff, mode) => __awaiter(void 0, void 0, void 0, function* () {
    const fs = createFsFromVolume(new Volume());
    return new Promise((resolve, reject) => {
        const filename = target.split('/').pop();
        const output = {
            path: '/',
            filename,
        };
        const compiler = (0, webpack_1.default)((0, exports.generateWebpackConfig)(target, handoff, output, mode));
        compiler.outputFileSystem = fs;
        compiler.run((err, stats) => {
            // Read the output later:
            const content = fs.readFileSync('/' + output.filename, 'utf-8');
            compiler.close((closeErr) => {
                if (err) {
                    reject(err);
                }
                if (closeErr) {
                    reject(closeErr);
                }
                resolve(content);
            });
        });
    });
});
exports.bundleJSWebpack = bundleJSWebpack;
const generateWebpackConfig = (entry, handoff, output, mode) => {
    var _a, _b;
    if (!output) {
        output = {
            path: path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath, '.handoff', `${handoff.config.figma_project_id}`, 'public', 'components'),
            filename: 'bundle.js',
        };
    }
    if (!mode) {
        mode = 'production';
    }
    const config = {
        mode,
        entry,
        resolve: {
            alias: {
                '@exported': path_1.default.join(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'integration'),
                '@integration': path_1.default.join(handoff.workingPath, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration', 'sass'),
            },
            modules: [
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath, 'src'),
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath, 'node_modules'),
                path_1.default.resolve(process.cwd(), 'node_modules'),
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'node_modules'),
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, (_b = handoff.config.integrationPath) !== null && _b !== void 0 ? _b : 'integration', 'sass'),
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'exported', handoff === null || handoff === void 0 ? void 0 : handoff.config.figma_project_id),
            ],
        },
        output,
        resolveLoader: {
            modules: [
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath),
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath),
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath, 'node_modules'),
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'node_modules'),
                path_1.default.resolve(process.cwd(), 'node_modules'),
            ],
        },
        module: {
            rules: [
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        // Creates `style` nodes from JS strings
                        'style-loader',
                        // Translates CSS into CommonJS
                        'css-loader',
                        // Compiles Sass to CSS
                        {
                            loader: 'sass-loader',
                            options: {
                                sassOptions: {
                                    indentWidth: 4,
                                    includePaths: [
                                        path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'node_modules'),
                                        path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath, 'node_modules'),
                                        path_1.default.resolve(process.cwd(), 'node_modules'),
                                        path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath),
                                        path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath),
                                    ],
                                },
                                additionalData: (content, loaderContext) => __awaiter(void 0, void 0, void 0, function* () {
                                    var _c;
                                    const integrationPath = path_1.default.join(handoff.workingPath, (_c = handoff.config.integrationPath) !== null && _c !== void 0 ? _c : 'integration', 'sass');
                                    if (fs_extra_1.default.existsSync(integrationPath)) {
                                        fs_extra_1.default.readdirSync(integrationPath)
                                            .filter((file) => {
                                            return path_1.default.extname(file).toLowerCase() === '.scss' && file !== 'main.scss';
                                        })
                                            .forEach((file) => {
                                            content = content + `\n @import "@integration/${file}";`;
                                        });
                                    }
                                    return content;
                                }),
                            },
                        },
                    ],
                },
            ],
        },
    };
    return config;
};
exports.generateWebpackConfig = generateWebpackConfig;
