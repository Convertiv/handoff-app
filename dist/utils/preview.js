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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWebpackConfig = exports.bundleJSWebpack = exports.buildClientFiles = void 0;
var webpack_1 = __importDefault(require("webpack"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var chalk_1 = __importDefault(require("chalk"));
var index_1 = require("../transformers/integration/index");
var _a = require('memfs'), createFsFromVolume = _a.createFsFromVolume, Volume = _a.Volume;
var buildClientFiles = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var entry;
    return __generator(this, function (_a) {
        if (!handoff) {
            throw Error('Handoff not initialized');
        }
        entry = (0, index_1.getIntegrationEntryPoint)(handoff);
        if (!entry) {
            return [2 /*return*/, Promise.resolve('')];
        }
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var compile = (0, webpack_1.default)((0, exports.generateWebpackConfig)(entry, handoff));
                compile.run(function (err, stats) {
                    var _a, _b;
                    if (err) {
                        var error = 'Errors encountered trying to build preview styles.\n';
                        if (handoff.debug) {
                            error += err.stack || err;
                        }
                        return reject(error);
                    }
                    if (stats) {
                        if (stats.hasErrors()) {
                            var buildErrors = (_a = stats.compilation.errors) === null || _a === void 0 ? void 0 : _a.map(function (err) { return err.message; });
                            var error = 'Errors encountered trying to build preview styles.\n';
                            if (handoff.debug) {
                                error += buildErrors;
                            }
                            return reject(error);
                        }
                        if (stats.hasWarnings()) {
                            var buildWarnings = (_b = stats.compilation.warnings) === null || _b === void 0 ? void 0 : _b.map(function (err) { return err.message; });
                            var error = 'Warnings encountered when building preview styles.\n';
                            if (handoff.debug) {
                                error += buildWarnings;
                                console.error(chalk_1.default.yellow(error));
                            }
                        }
                    }
                    compile.close(function (closeErr) { });
                    return resolve('Preview styles successfully built.');
                });
            })];
    });
}); };
exports.buildClientFiles = buildClientFiles;
var bundleJSWebpack = function (target, handoff, mode) { return __awaiter(void 0, void 0, void 0, function () {
    var fs;
    return __generator(this, function (_a) {
        fs = createFsFromVolume(new Volume());
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var filename = target.split('/').pop();
                var output = {
                    path: '/',
                    filename: filename,
                };
                var compiler = (0, webpack_1.default)((0, exports.generateWebpackConfig)(target, handoff, output, mode));
                compiler.outputFileSystem = fs;
                compiler.run(function (err, stats) {
                    // Read the output later:
                    var content = fs.readFileSync('/' + output.filename, 'utf-8');
                    compiler.close(function (closeErr) {
                        if (err) {
                            reject(err);
                        }
                        if (closeErr) {
                            reject(closeErr);
                        }
                        resolve(content);
                    });
                });
            })];
    });
}); };
exports.bundleJSWebpack = bundleJSWebpack;
var generateWebpackConfig = function (entry, handoff, output, mode) {
    if (!output) {
        output = {
            path: path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath, '.handoff', "".concat(handoff.config.figma_project_id), 'public', 'components'),
            filename: 'bundle.js',
        };
    }
    if (!mode) {
        mode = 'production';
    }
    var config = {
        mode: mode,
        entry: entry,
        resolve: {
            alias: {
                '@exported': path_1.default.join(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'integration'),
                '@integration': path_1.default.join(handoff.workingPath, 'integration/sass'),
            },
            modules: [
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath, 'src'),
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.modulePath, 'node_modules'),
                path_1.default.resolve(process.cwd(), 'node_modules'),
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'node_modules'),
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'integration/sass'),
                path_1.default.resolve(handoff === null || handoff === void 0 ? void 0 : handoff.workingPath, 'exported', handoff === null || handoff === void 0 ? void 0 : handoff.config.figma_project_id),
            ],
        },
        output: output,
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
                                additionalData: function (content, loaderContext) { return __awaiter(void 0, void 0, void 0, function () {
                                    var integrationPath;
                                    return __generator(this, function (_a) {
                                        integrationPath = path_1.default.join(handoff.workingPath, 'integration/sass');
                                        if (fs_extra_1.default.existsSync(integrationPath)) {
                                            fs_extra_1.default.readdirSync(integrationPath)
                                                .filter(function (file) {
                                                return path_1.default.extname(file).toLowerCase() === '.scss' && file !== 'main.scss';
                                            })
                                                .forEach(function (file) {
                                                content = content + "\n @import \"@integration/".concat(file, "\";");
                                            });
                                        }
                                        return [2 /*return*/, content];
                                    });
                                }); },
                            },
                        },
                    ],
                },
            ],
        },
    };
    config = handoff.integrationHooks.hooks.webpack(handoff, config);
    config = handoff.hooks.webpack(config);
    return config;
};
exports.generateWebpackConfig = generateWebpackConfig;
