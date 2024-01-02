"use strict";
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
exports.buildIntegrationOnly = void 0;
var changelog_1 = __importDefault(require("./changelog"));
var prompt_1 = require("./utils/prompt");
var chalk_1 = __importDefault(require("chalk"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
require("dotenv/config");
var stream = __importStar(require("node:stream"));
var api_1 = require("./figma/api");
var documentation_object_1 = require("./documentation-object");
var api_2 = require("./api");
var index_1 = __importStar(require("./transformers/scss/index"));
var index_2 = __importDefault(require("./transformers/css/index"));
var index_3 = __importDefault(require("./transformers/integration/index"));
var index_4 = __importDefault(require("./transformers/font/index"));
var index_5 = __importDefault(require("./transformers/preview/index"));
var preview_1 = require("./utils/preview");
var app_1 = __importDefault(require("./app"));
var sd_1 = __importDefault(require("./transformers/sd"));
var map_1 = __importDefault(require("./transformers/map"));
var config;
var outputPath = function (handoff) { return path_1.default.resolve(handoff.workingPath, handoff.outputDirectory, handoff.config.figma_project_id); };
var tokensFilePath = function (handoff) { return path_1.default.join(outputPath(handoff), 'tokens.json'); };
var previewFilePath = function (handoff) { return path_1.default.join(outputPath(handoff), 'preview.json'); };
var changelogFilePath = function (handoff) { return path_1.default.join(outputPath(handoff), 'changelog.json'); };
var variablesFilePath = function (handoff) { return path_1.default.join(outputPath(handoff), 'tokens'); };
var iconsZipFilePath = function (handoff) { return path_1.default.join(outputPath(handoff), 'icons.zip'); };
var logosZipFilePath = function (handoff) { return path_1.default.join(outputPath(handoff), 'logos.zip'); };
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
/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
var buildCustomFonts = function (handoff, documentationObject) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, index_4.default)(handoff, documentationObject)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
/**
 * Build just the custom fonts
 * @param documentationObject
 * @returns
 */
var buildIntegration = function (handoff, documentationObject) { return __awaiter(void 0, void 0, void 0, function () {
    var integration;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, index_3.default)(handoff, documentationObject)];
            case 1:
                integration = _a.sent();
                return [2 /*return*/, integration];
        }
    });
}); };
/**
 * Run just the preview
 * @param documentationObject
*/
var buildPreview = function (handoff, documentationObject) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    (0, index_5.default)(handoff, documentationObject).then(function (out) { return fs_extra_1.default.writeJSON(previewFilePath(handoff), out, { spaces: 2 }); }),
                ])];
            case 1:
                _a.sent();
                if (!(Object.keys(documentationObject.components).filter(function (name) { return documentationObject.components[name].instances.length > 0; }).length > 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, preview_1.buildClientFiles)(handoff)
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
var buildStyles = function (handoff, documentationObject) { return __awaiter(void 0, void 0, void 0, function () {
    var typeFiles, cssFiles, scssFiles, sdFiles, mapFiles;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                typeFiles = (0, index_1.scssTypesTransformer)(documentationObject);
                typeFiles = handoff.hooks.typeTransformer(documentationObject, typeFiles);
                cssFiles = (0, index_2.default)(documentationObject);
                cssFiles = handoff.hooks.cssTransformer(documentationObject, cssFiles);
                scssFiles = (0, index_1.default)(documentationObject);
                scssFiles = handoff.hooks.scssTransformer(documentationObject, scssFiles);
                sdFiles = (0, sd_1.default)(documentationObject);
                sdFiles = handoff.hooks.styleDictionaryTransformer(documentationObject, sdFiles);
                mapFiles = (0, map_1.default)(documentationObject);
                mapFiles = handoff.hooks.mapTransformer(documentationObject, mapFiles);
                return [4 /*yield*/, Promise.all([
                        fs_extra_1.default
                            .ensureDir(variablesFilePath(handoff))
                            .then(function () { return fs_extra_1.default.ensureDir("".concat(variablesFilePath(handoff), "/types")); })
                            .then(function () { return fs_extra_1.default.ensureDir("".concat(variablesFilePath(handoff), "/css")); })
                            .then(function () { return fs_extra_1.default.ensureDir("".concat(variablesFilePath(handoff), "/sass")); })
                            .then(function () { return fs_extra_1.default.ensureDir("".concat(variablesFilePath(handoff), "/sd/tokens")); })
                            .then(function () { return fs_extra_1.default.ensureDir("".concat(variablesFilePath(handoff), "/maps")); })
                            .then(function () { return Promise.all(Object.entries(sdFiles.components).map(function (_a) {
                            var name = _a[0], _ = _a[1];
                            return fs_extra_1.default.ensureDir("".concat(variablesFilePath(handoff), "/sd/tokens/").concat(name));
                        })); })
                            .then(function () {
                            return Promise.all(Object.entries(typeFiles.components).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath(handoff), "/types/").concat(name, ".scss"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(typeFiles.design).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath(handoff), "/types/").concat(name, ".scss"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(cssFiles.components).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath(handoff), "/css/").concat(name, ".css"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(cssFiles.design).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath(handoff), "/css/").concat(name, ".css"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(scssFiles.components).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath(handoff), "/sass/").concat(name, ".scss"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(scssFiles.design).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath(handoff), "/sass/").concat(name, ".scss"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(sdFiles.components).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath(handoff), "/sd/tokens/").concat(name, "/").concat(name, ".tokens.json"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(sdFiles.design).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath(handoff), "/sd/tokens/").concat(name, ".tokens.json"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(mapFiles.components).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath(handoff), "/maps/").concat(name, ".json"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(mapFiles.design).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(variablesFilePath(handoff), "/maps/").concat(name, ".json"), content);
                            }));
                        })
                            .then(function () {
                            return Promise.all(Object.entries(mapFiles.attachments).map(function (_a) {
                                var name = _a[0], content = _a[1];
                                return fs_extra_1.default.writeFile("".concat(outputPath(handoff), "/").concat(name, ".json"), content);
                            }));
                        }),
                    ])];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var validateHandoffRequirements = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var requirements, result;
    return __generator(this, function (_a) {
        requirements = false;
        result = process.versions;
        if (result && result.node) {
            if (parseInt(result.node) >= 16) {
                requirements = true;
            }
        }
        else {
            // couldn't find the right version, but ...
        }
        if (!requirements) {
            console.log(chalk_1.default.redBright('Handoff Installation failed'));
            console.log(chalk_1.default.yellow('- Please update node to at least Node 16 https://nodejs.org/en/download. \n- You can read more about installing handoff at https://www.handoff.com/docs/'));
            throw new Error('Could not run handoff');
        }
        return [2 /*return*/];
    });
}); };
/**
 * Validate the figma auth tokens
 * @param handoff
 */
var validateFigmaAuth = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var DEV_ACCESS_TOKEN, FIGMA_PROJECT_ID, missingEnvVars, writeEnvFile, envFile;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                DEV_ACCESS_TOKEN = handoff.config.dev_access_token;
                FIGMA_PROJECT_ID = handoff.config.figma_project_id;
                if (DEV_ACCESS_TOKEN && FIGMA_PROJECT_ID) {
                    return [2 /*return*/];
                }
                missingEnvVars = false;
                if (!!DEV_ACCESS_TOKEN) return [3 /*break*/, 2];
                missingEnvVars = true;
                console.log(chalk_1.default.yellow("Figma developer access token not found. You can supply it as an environment variable or .env file at DEV_ACCESS_TOKEN.\nUse these instructions to generate them ".concat(chalk_1.default.blue("https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens"), "\n")));
                return [4 /*yield*/, (0, prompt_1.maskPrompt)(chalk_1.default.green('Figma Developer Key: '))];
            case 1:
                DEV_ACCESS_TOKEN = _a.sent();
                _a.label = 2;
            case 2:
                if (!!FIGMA_PROJECT_ID) return [3 /*break*/, 4];
                missingEnvVars = true;
                console.log(chalk_1.default.yellow("\n\nFigma project id not found. You can supply it as an environment variable or .env file at FIGMA_PROJECT_ID.\nYou can find this by looking at the url of your Figma file. If the url is ".concat(chalk_1.default.blue("https://www.figma.com/file/IGYfyraLDa0BpVXkxHY2tE/Starter-%5BV2%5D"), "\nyour id would be IGYfyraLDa0BpVXkxHY2tE\n")));
                return [4 /*yield*/, (0, prompt_1.maskPrompt)(chalk_1.default.green('Figma Project Id: '))];
            case 3:
                FIGMA_PROJECT_ID = _a.sent();
                _a.label = 4;
            case 4:
                if (!missingEnvVars) return [3 /*break*/, 8];
                console.log(chalk_1.default.yellow("\n\nYou supplied at least one required variable. We can write these variables to a local env \nfile for you to make it easier to run the pipeline in the future.\n"));
                return [4 /*yield*/, (0, prompt_1.prompt)(chalk_1.default.green('Write environment variables to .env file? (y/n): '))];
            case 5:
                writeEnvFile = _a.sent();
                if (!(writeEnvFile !== 'y')) return [3 /*break*/, 6];
                console.log(chalk_1.default.green("Skipping .env file creation. You will need to supply these variables in the future.\n"));
                return [3 /*break*/, 8];
            case 6:
                envFile = "\nDEV_ACCESS_TOKEN=\"".concat(DEV_ACCESS_TOKEN, "\"\nFIGMA_PROJECT_ID=\"").concat(FIGMA_PROJECT_ID, "\"\n");
                return [4 /*yield*/, fs_extra_1.default.writeFile(path_1.default.resolve(handoff.workingPath, '.env'), envFile)];
            case 7:
                _a.sent();
                console.log(chalk_1.default.green("\nAn .env file was created in the root of your project. Since these are sensitive variables, please do not commit this file.\n"));
                _a.label = 8;
            case 8:
                handoff.config.dev_access_token = DEV_ACCESS_TOKEN;
                handoff.config.figma_project_id = FIGMA_PROJECT_ID;
                return [2 /*return*/];
        }
    });
}); };
var figmaExtract = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var prevDocumentationObject, changelog, documentationObject, changelogRecord, outputFolder;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log(chalk_1.default.green("Starting Figma data extraction."));
                return [4 /*yield*/, readPrevJSONFile(tokensFilePath(handoff))];
            case 1:
                prevDocumentationObject = _a.sent();
                return [4 /*yield*/, readPrevJSONFile(changelogFilePath(handoff))];
            case 2:
                changelog = (_a.sent()) || [];
                return [4 /*yield*/, fs_extra_1.default.emptyDir(outputPath(handoff))];
            case 3:
                _a.sent();
                return [4 /*yield*/, (0, documentation_object_1.createDocumentationObject)(handoff.config.figma_project_id, handoff.config.dev_access_token)];
            case 4:
                documentationObject = _a.sent();
                changelogRecord = (0, changelog_1.default)(prevDocumentationObject, documentationObject);
                if (changelogRecord) {
                    changelog = __spreadArray([changelogRecord], changelog, true);
                }
                handoff.hooks.build(documentationObject);
                return [4 /*yield*/, Promise.all(__spreadArray([
                        fs_extra_1.default.writeJSON(tokensFilePath(handoff), documentationObject, { spaces: 2 }),
                        fs_extra_1.default.writeJSON(changelogFilePath(handoff), changelog, { spaces: 2 })
                    ], (!process.env.CREATE_ASSETS_ZIP_FILES || process.env.CREATE_ASSETS_ZIP_FILES !== 'false'
                        ? [
                            (0, api_2.zipAssets)(documentationObject.assets.icons, fs_extra_1.default.createWriteStream(iconsZipFilePath(handoff))).then(function (writeStream) {
                                return stream.promises.finished(writeStream);
                            }),
                            (0, api_2.zipAssets)(documentationObject.assets.logos, fs_extra_1.default.createWriteStream(logosZipFilePath(handoff))).then(function (writeStream) {
                                return stream.promises.finished(writeStream);
                            }),
                        ]
                        : []), true))];
            case 5:
                _a.sent();
                outputFolder = path_1.default.resolve(handoff.modulePath, 'src', "~app-".concat(handoff.config.figma_project_id), 'public');
                if (!!fs_extra_1.default.existsSync(outputFolder)) return [3 /*break*/, 7];
                return [4 /*yield*/, fs_extra_1.default.promises.mkdir(outputFolder, { recursive: true })];
            case 6:
                _a.sent();
                _a.label = 7;
            case 7:
                // copy assets to output folder
                fs_extra_1.default.copyFileSync(iconsZipFilePath(handoff), path_1.default.join(handoff.modulePath, 'src', "~app-".concat(handoff.config.figma_project_id), 'public', 'icons.zip'));
                fs_extra_1.default.copyFileSync(logosZipFilePath(handoff), path_1.default.join(handoff.modulePath, 'src', "~app-".concat(handoff.config.figma_project_id), 'public', 'logos.zip'));
                return [2 /*return*/, documentationObject];
        }
    });
}); };
/**
 * Build only integrations and previews
 * @param handoff
 */
var buildIntegrationOnly = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var documentationObject;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, readPrevJSONFile(tokensFilePath(handoff))];
            case 1:
                documentationObject = _a.sent();
                if (!documentationObject) return [3 /*break*/, 4];
                return [4 /*yield*/, buildIntegration(handoff, documentationObject)];
            case 2:
                _a.sent();
                return [4 /*yield*/, buildPreview(handoff, documentationObject)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.buildIntegrationOnly = buildIntegrationOnly;
/**
 * Run the entire pipeline
 */
var pipeline = function (handoff, build) { return __awaiter(void 0, void 0, void 0, function () {
    var documentationObject;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!handoff.config) {
                    throw new Error('Handoff config not found');
                }
                console.log(chalk_1.default.green("Starting Handoff Figma data pipeline. Checking for environment and config.\n"));
                return [4 /*yield*/, validateHandoffRequirements(handoff)];
            case 1:
                _a.sent();
                return [4 /*yield*/, validateFigmaAuth(handoff)];
            case 2:
                _a.sent();
                return [4 /*yield*/, figmaExtract(handoff)];
            case 3:
                documentationObject = _a.sent();
                return [4 /*yield*/, buildCustomFonts(handoff, documentationObject)];
            case 4:
                _a.sent();
                return [4 /*yield*/, buildStyles(handoff, documentationObject)];
            case 5:
                _a.sent();
                return [4 /*yield*/, buildIntegration(handoff, documentationObject)];
            case 6:
                _a.sent();
                return [4 /*yield*/, buildPreview(handoff, documentationObject)];
            case 7:
                _a.sent();
                if (!build) return [3 /*break*/, 9];
                return [4 /*yield*/, (0, app_1.default)(handoff)];
            case 8:
                _a.sent();
                _a.label = 9;
            case 9:
                // (await pluginTransformer()).postBuild(documentationObject);
                console.log(chalk_1.default.green("Figma pipeline complete:", "".concat((0, api_1.getRequestCount)(), " requests")));
                return [2 /*return*/];
        }
    });
}); };
exports.default = pipeline;
