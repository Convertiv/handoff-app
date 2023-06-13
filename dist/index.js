"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var changelog_1 = __importDefault(require("./changelog"));
var config_1 = require("./config");
var prompt_1 = require("./utils/prompt");
var chalk_1 = __importDefault(require("chalk"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var index_1 = require("./utils/index");
require("dotenv/config");
var stream = __importStar(require("node:stream"));
var api_1 = require("./figma/api");
var merge_1 = __importDefault(require("lodash/merge"));
var documentation_object_1 = require("./documentation-object");
var api_2 = require("./api");
var index_2 = __importStar(require("./transformers/scss/index"));
var index_3 = __importDefault(require("./transformers/css/index"));
var index_4 = __importDefault(require("./transformers/integration/index"));
var index_5 = __importDefault(require("./transformers/font/index"));
var index_6 = __importDefault(require("./transformers/preview/index"));
var preview_1 = require("./utils/preview");
var app_1 = __importStar(require("./app"));
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);
var config;
var outputFolder = process.env.OUTPUT_DIR || 'exported';
var exportablesFolder = 'config/exportables';
var tokensFilePath = path_1.default.join(outputFolder, 'tokens.json');
var previewFilePath = path_1.default.join(outputFolder, 'preview.json');
var changelogFilePath = path_1.default.join(outputFolder, 'changelog.json');
var variablesFilePath = path_1.default.join(outputFolder, 'tokens');
var iconsZipFilePath = path_1.default.join(outputFolder, 'icons.zip');
var logosZipFilePath = path_1.default.join(outputFolder, 'logos.zip');
/**
 * Read Previous Json File
 * @param path
 * @returns
 */
var readPrevJSONFile = function (path) { return __awaiter(void 0, void 0, void 0, function () {
    var e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs_extra_1.default.readJSON(path)];
            case 1: return [2 /*return*/, _a.sent()];
            case 2:
                e_1 = _a.sent();
                return [2 /*return*/, undefined];
            case 3: return [2 /*return*/];
        }
    });
}); };
var formatComponentsTransformerOptions = function (exportables) {
    return new Map(Object.entries(exportables.reduce(function (res, exportable) {
        var _a;
        return __assign(__assign({}, res), (_a = {}, _a[exportable.id] = __assign(__assign({}, exportable.options.transformer), exportable.options.shared), _a));
    }, {})));
};
var getExportables = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var config_2, definitions, exportables;
    var _a;
    return __generator(this, function (_b) {
        try {
            if (!handoff.config) {
                throw new Error('Handoff config not found');
            }
            config_2 = handoff.config;
            definitions = (_a = config_2 === null || config_2 === void 0 ? void 0 : config_2.figma) === null || _a === void 0 ? void 0 : _a.definitions;
            if (!definitions || definitions.length === 0) {
                return [2 /*return*/, []];
            }
            exportables = definitions
                .map(function (def) {
                var _a;
                var defPath = path_1.default.resolve(path_1.default.join(handoff.modulePath, exportablesFolder, "".concat(def, ".json")));
                var projectPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, exportablesFolder, "".concat(def, ".json")));
                // If the project path exists, use that first as an override
                if (fs_extra_1.default.existsSync(projectPath)) {
                    defPath = projectPath;
                }
                else if (!fs_extra_1.default.existsSync(defPath)) {
                    return null;
                }
                var defBuffer = fs_extra_1.default.readFileSync(defPath);
                var exportable = JSON.parse(defBuffer.toString());
                var exportableOptions = {};
                (0, merge_1.default)(exportableOptions, (_a = config_2 === null || config_2 === void 0 ? void 0 : config_2.figma) === null || _a === void 0 ? void 0 : _a.options, exportable.options);
                exportable.options = exportableOptions;
                return exportable;
            })
                .filter(index_1.filterOutNull);
            return [2 /*return*/, exportables ? exportables : []];
        }
        catch (e) {
            return [2 /*return*/, []];
        }
        return [2 /*return*/];
    });
}); };
/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
var buildCustomFonts = function (documentationObject) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, index_5.default)(documentationObject)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
var buildIntegration = function (documentationObject) { return __awaiter(void 0, void 0, void 0, function () {
    var handoff, integration;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                handoff = (0, config_1.getHandoff)();
                return [4 /*yield*/, (0, index_4.default)(documentationObject)];
            case 1:
                integration = _a.sent();
                handoff.hooks.integration(documentationObject);
                return [2 /*return*/, integration];
        }
    });
}); };
/**
 * Run just the preview
 * @param documentationObject
 */
var buildPreview = function (documentationObject) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(Object.keys(documentationObject.components).filter(function (name) { return documentationObject.components[name].length > 0; }).length > 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, Promise.all([(0, index_6.default)(documentationObject).then(function (out) { return fs_extra_1.default.writeJSON(previewFilePath, out, { spaces: 2 }); })])];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, preview_1.buildClientFiles)()
                        .then(function (value) { return console.log(chalk_1.default.green(value)); })
                        .catch(function (error) {
                        throw new Error(error);
                    })];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                console.log(chalk_1.default.red('Skipping preview generation'));
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); };
/**
 * Build only the styles pipeline
 * @param documentationObject
 */
var buildStyles = function (documentationObject, options) { return __awaiter(void 0, void 0, void 0, function () {
    var typeFiles, cssFiles, scssFiles;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                typeFiles = (0, index_2.scssTypesTransformer)(documentationObject, options);
                cssFiles = (0, index_3.default)(documentationObject, options);
                scssFiles = (0, index_2.default)(documentationObject, options);
                // scssFiles = (await pluginTransformer()).postTypeTransformer(documentationObject, scssFiles);
                return [4 /*yield*/, Promise.all([
                        fs_extra_1.default
                            .ensureDir(variablesFilePath)
                            .then(function () { return fs_extra_1.default.ensureDir("".concat(variablesFilePath, "/types")); })
                            .then(function () { return fs_extra_1.default.ensureDir("".concat(variablesFilePath, "/css")); })
                            .then(function () { return fs_extra_1.default.ensureDir("".concat(variablesFilePath, "/sass")); })
                            .then(function () {
                            return Promise.all(Object.entries(typeFiles.components).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath, "/types/").concat(name, ".scss"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(typeFiles.design).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath, "/types/").concat(name, ".scss"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(cssFiles.components).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath, "/css/").concat(name, ".css"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(cssFiles.design).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath, "/css/").concat(name, ".css"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(scssFiles.components).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath, "/sass/").concat(name, ".scss"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(scssFiles.design).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath, "/sass/").concat(name, ".scss"), content);
                            }));
                        }),
                    ])];
            case 1:
                // scssFiles = (await pluginTransformer()).postTypeTransformer(documentationObject, scssFiles);
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
/**
 * Run the entire pipeline
 */
var pipeline = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var DEV_ACCESS_TOKEN, FIGMA_PROJECT_ID, prevDocumentationObject, changelog, exportables, componentTransformerOptions, documentationObject, changelogRecord;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!handoff.config) {
                    throw new Error('Handoff config not found');
                }
                DEV_ACCESS_TOKEN = process.env.DEV_ACCESS_TOKEN;
                FIGMA_PROJECT_ID = process.env.FIGMA_PROJECT_ID;
                console.log(chalk_1.default.green("Starting Handoff Figma data pipeline. Checking for environment and config.\n"));
                if (!!DEV_ACCESS_TOKEN) return [3 /*break*/, 2];
                console.log(chalk_1.default.yellow("- Developer access token not found. You can supply it in an ENV or .env file at DEV_ACCESS_TOKEN.\nPlease enter your developer access token.\n"));
                return [4 /*yield*/, (0, prompt_1.maskPrompt)(chalk_1.default.green('Figma Developer Key: '))];
            case 1:
                DEV_ACCESS_TOKEN = _a.sent();
                _a.label = 2;
            case 2:
                handoff.config.dev_access_token = DEV_ACCESS_TOKEN;
                if (!!FIGMA_PROJECT_ID) return [3 /*break*/, 4];
                console.log(chalk_1.default.yellow("Figma project id not found. You can supply it in an ENV or .env file at FIGMA_PROJECT_ID.\nPlease enter your Figma Project Id.\n"));
                return [4 /*yield*/, (0, prompt_1.maskPrompt)(chalk_1.default.green('Figma Project Id: '))];
            case 3:
                FIGMA_PROJECT_ID = _a.sent();
                _a.label = 4;
            case 4:
                handoff.config.dev_access_token = FIGMA_PROJECT_ID;
                return [4 /*yield*/, readPrevJSONFile(tokensFilePath)];
            case 5:
                prevDocumentationObject = _a.sent();
                return [4 /*yield*/, readPrevJSONFile(changelogFilePath)];
            case 6:
                changelog = (_a.sent()) || [];
                return [4 /*yield*/, fs_extra_1.default.emptyDir(outputFolder)];
            case 7:
                _a.sent();
                return [4 /*yield*/, getExportables(handoff)];
            case 8:
                exportables = _a.sent();
                componentTransformerOptions = formatComponentsTransformerOptions(exportables);
                return [4 /*yield*/, (0, documentation_object_1.createDocumentationObject)(FIGMA_PROJECT_ID, DEV_ACCESS_TOKEN, exportables)];
            case 9:
                documentationObject = _a.sent();
                changelogRecord = (0, changelog_1.default)(prevDocumentationObject, documentationObject);
                if (changelogRecord) {
                    changelog = __spreadArray([changelogRecord], changelog, true);
                }
                return [4 /*yield*/, Promise.all(__spreadArray([
                        fs_extra_1.default.writeJSON(tokensFilePath, documentationObject, { spaces: 2 }),
                        fs_extra_1.default.writeJSON(changelogFilePath, changelog, { spaces: 2 })
                    ], (!process.env.CREATE_ASSETS_ZIP_FILES || process.env.CREATE_ASSETS_ZIP_FILES !== 'false'
                        ? [
                            (0, api_2.zipAssets)(documentationObject.assets.icons, fs_extra_1.default.createWriteStream(iconsZipFilePath)).then(function (writeStream) {
                                return stream.promises.finished(writeStream);
                            }),
                            (0, api_2.zipAssets)(documentationObject.assets.logos, fs_extra_1.default.createWriteStream(logosZipFilePath)).then(function (writeStream) {
                                return stream.promises.finished(writeStream);
                            }),
                        ]
                        : []), true))];
            case 10:
                _a.sent();
                return [4 /*yield*/, buildCustomFonts(documentationObject)];
            case 11:
                _a.sent();
                return [4 /*yield*/, buildStyles(documentationObject, componentTransformerOptions)];
            case 12:
                _a.sent();
                return [4 /*yield*/, buildIntegration(documentationObject)];
            case 13:
                _a.sent();
                if (!handoff.config.buildApp) return [3 /*break*/, 16];
                return [4 /*yield*/, buildPreview(documentationObject)];
            case 14:
                _a.sent();
                return [4 /*yield*/, (0, app_1.default)(handoff)];
            case 15:
                _a.sent();
                return [3 /*break*/, 17];
            case 16:
                console.log(chalk_1.default.red('Skipping app generation'));
                _a.label = 17;
            case 17:
                // (await pluginTransformer()).postBuild(documentationObject);
                console.log(chalk_1.default.green("Figma pipeline complete:", "".concat((0, api_1.getRequestCount)(), " requests")));
                return [2 /*return*/];
        }
    });
}); };
global.handoff = null;
var Handoff = /** @class */ (function () {
    function Handoff() {
        this.debug = false;
        this.modulePath = path_1.default.resolve(__filename, '../..');
        this.workingPath = process.cwd();
        this.config = null;
        this.hooks = {
            init: function () { },
            fetch: function () { },
            build: function (documentationObject) { },
            typeTransformer: function (documentationObject, types) { return types; },
            integration: function (documentationObject) { },
            cssTransformer: function (documentationObject, css) { return css; },
            scssTransformer: function (documentationObject, scss) { return scss; },
            webpack: function (webpackConfig) { return webpackConfig; },
            preview: function (webpackConfig, preview) { return preview; },
        };
        global.handoff = this;
    }
    Handoff.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, (0, config_1.getConfig)()];
                    case 1:
                        _a.config = _b.sent();
                        (0, config_1.serializeHandoff)();
                        return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.fetch = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, pipeline(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.build = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, app_1.default)(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.export = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, app_1.exportNext)(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, app_1.watchApp)(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.postInit = function (callback) {
        this.hooks.init = callback;
    };
    Handoff.prototype.postTypeTransformer = function (callback) {
        this.hooks.typeTransformer = callback;
    };
    Handoff.prototype.postCssTransformer = function (callback) {
        this.hooks.cssTransformer = callback;
    };
    Handoff.prototype.postScssTransformer = function (callback) {
        this.hooks.scssTransformer = callback;
    };
    Handoff.prototype.postPreview = function (callback) {
        this.hooks.preview = callback;
    };
    Handoff.prototype.postBuild = function (callback) {
        this.hooks.build = callback;
    };
    Handoff.prototype.postIntegration = function (callback) {
        this.hooks.integration = callback;
    };
    Handoff.prototype.modifyWebpackConfig = function (callback) {
        this.hooks.webpack = callback;
    };
    return Handoff;
}());
exports.default = Handoff;
