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
exports.zipTokens = exports.addFileToZip = exports.instantiateIntegration = exports.getIntegrationEntryPoint = exports.getPathToIntegration = exports.HandoffIntegration = void 0;
var handlebars_1 = __importDefault(require("handlebars"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var archiver_1 = __importDefault(require("archiver"));
var utils_1 = require("../utils");
var tokens_1 = require("../tokens");
var chalk_1 = __importDefault(require("chalk"));
var HandoffIntegration = /** @class */ (function () {
    function HandoffIntegration(name) {
        this.name = name;
        this.hooks = {
            integration: function (documentationObject, artifacts) { return artifacts; },
            webpack: function (handoff, webpackConfig) { return webpackConfig; },
            preview: function (webpackConfig, preview) { return preview; },
        };
    }
    HandoffIntegration.prototype.postIntegration = function (callback) {
        this.hooks.integration = callback;
    };
    HandoffIntegration.prototype.modifyWebpackConfig = function (callback) {
        this.hooks.webpack = callback;
    };
    HandoffIntegration.prototype.postPreview = function (callback) {
        this.hooks.preview = callback;
    };
    return HandoffIntegration;
}());
exports.HandoffIntegration = HandoffIntegration;
/**
 * Derive the path to the integration.
 */
var getPathToIntegration = function (handoff, resolveTemplatePath) {
    if (!handoff) {
        throw Error('Handoff not initialized');
    }
    var integrationPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'integration'));
    if (fs_extra_1.default.existsSync(integrationPath)) {
        return integrationPath;
    }
    if (resolveTemplatePath) {
        return path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config', 'templates', 'integration'));
    }
    return null;
};
exports.getPathToIntegration = getPathToIntegration;
/**
 * Get the entry point for the integration
 * @returns string
 */
var getIntegrationEntryPoint = function (handoff) {
    var _a, _b;
    return (_b = (_a = handoff === null || handoff === void 0 ? void 0 : handoff.integrationObject) === null || _a === void 0 ? void 0 : _a.entries) === null || _b === void 0 ? void 0 : _b.bundle;
};
exports.getIntegrationEntryPoint = getIntegrationEntryPoint;
var instantiateIntegration = function (handoff) {
    if (!handoff || !(handoff === null || handoff === void 0 ? void 0 : handoff.config)) {
        throw Error('Handoff not initialized');
    }
    return new HandoffIntegration(handoff.integrationObject ? handoff.integrationObject.name : undefined);
};
exports.instantiateIntegration = instantiateIntegration;
/**
 * A recusrive function for building a zip of the tokens
 * @param directory
 * @param dirPath
 * @param archive
 * @returns
 */
var addFileToZip = function (directory, dirPath, archive) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, directory_1, file, pathFile, recurse, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _i = 0, directory_1 = directory;
                _a.label = 1;
            case 1:
                if (!(_i < directory_1.length)) return [3 /*break*/, 6];
                file = directory_1[_i];
                pathFile = path_1.default.join(dirPath, file);
                if (!fs_extra_1.default.lstatSync(pathFile).isDirectory()) return [3 /*break*/, 4];
                return [4 /*yield*/, fs_extra_1.default.readdir(pathFile)];
            case 2:
                recurse = _a.sent();
                return [4 /*yield*/, (0, exports.addFileToZip)(recurse, pathFile, archive)];
            case 3:
                archive = _a.sent();
                return [3 /*break*/, 5];
            case 4:
                data = fs_extra_1.default.readFileSync(pathFile, 'utf-8');
                archive.append(data, { name: pathFile });
                _a.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 1];
            case 6: return [2 /*return*/, archive];
        }
    });
}); };
exports.addFileToZip = addFileToZip;
/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
var zipTokens = function (dirPath, destination) { return __awaiter(void 0, void 0, void 0, function () {
    var archive, directory;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                archive = (0, archiver_1.default)('zip', {
                    zlib: { level: 9 }, // Sets the compression level.
                });
                // good practice to catch this error explicitly
                archive.on('error', function (err) {
                    throw err;
                });
                archive.pipe(destination);
                return [4 /*yield*/, fs_extra_1.default.readdir(dirPath)];
            case 1:
                directory = _a.sent();
                return [4 /*yield*/, (0, exports.addFileToZip)(directory, dirPath, archive)];
            case 2:
                archive = _a.sent();
                return [4 /*yield*/, archive.finalize()];
            case 3:
                _a.sent();
                return [2 /*return*/, destination];
        }
    });
}); };
exports.zipTokens = zipTokens;
var buildIntegration = function (sourcePath, destPath, documentationObject, rootPath, rootReturnPath) { return __awaiter(void 0, void 0, void 0, function () {
    var items, components, componentsWithInstances, _i, items_1, item, sourceItemPath, destItemPath, stat, content, template, renderedContent;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                rootPath !== null && rootPath !== void 0 ? rootPath : (rootPath = sourcePath);
                return [4 /*yield*/, fs_extra_1.default.readdir(sourcePath)];
            case 1:
                items = _a.sent();
                components = Object.keys(documentationObject.components);
                componentsWithInstances = components.filter(function (component) { return documentationObject.components[component].instances.length > 0; });
                _i = 0, items_1 = items;
                _a.label = 2;
            case 2:
                if (!(_i < items_1.length)) return [3 /*break*/, 11];
                item = items_1[_i];
                sourceItemPath = path_1.default.join(sourcePath, item);
                destItemPath = path_1.default.join(destPath, item);
                return [4 /*yield*/, fs_extra_1.default.stat(sourceItemPath)];
            case 3:
                stat = _a.sent();
                if (!stat.isDirectory()) return [3 /*break*/, 6];
                // Create the directory in the destination path if it doesn't exist
                return [4 /*yield*/, fs_extra_1.default.ensureDir(destItemPath)];
            case 4:
                // Create the directory in the destination path if it doesn't exist
                _a.sent();
                // Recursively process the directory
                return [4 /*yield*/, buildIntegration(sourceItemPath, destItemPath, documentationObject, rootPath, (rootReturnPath !== null && rootReturnPath !== void 0 ? rootReturnPath : '../') + '../')];
            case 5:
                // Recursively process the directory
                _a.sent();
                return [3 /*break*/, 10];
            case 6: return [4 /*yield*/, loadTemplateContent(sourceItemPath)];
            case 7:
                content = _a.sent();
                template = handlebars_1.default.compile(content);
                renderedContent = template({
                    components: Object.keys(documentationObject.components),
                    documentationObject: documentationObject,
                });
                // Ensure the directory exists before writing the file
                return [4 /*yield*/, fs_extra_1.default.ensureDir(path_1.default.dirname(destItemPath))];
            case 8:
                // Ensure the directory exists before writing the file
                _a.sent();
                // Write the rendered content to the destination path
                return [4 /*yield*/, fs_extra_1.default.writeFile(destItemPath, replaceHandoffImportTokens(renderedContent, componentsWithInstances, path_1.default.parse(destItemPath).dir, rootPath, rootReturnPath !== null && rootReturnPath !== void 0 ? rootReturnPath : '../'))];
            case 9:
                // Write the rendered content to the destination path
                _a.sent();
                _a.label = 10;
            case 10:
                _i++;
                return [3 /*break*/, 2];
            case 11: return [2 /*return*/];
        }
    });
}); };
/**
 * Asynchronously loads the content of a template file.
 *
 * @param {string} path - The path to the template file.
 * @returns {Promise<string>} - A promise that resolves to the content of the file.
 */
var loadTemplateContent = function (path) { return __awaiter(void 0, void 0, void 0, function () {
    var content;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, fs_extra_1.default.readFile(path, 'utf-8')];
            case 1:
                content = _a.sent();
                return [2 /*return*/, content];
        }
    });
}); };
/**
 * Find the integration to sync and sync the sass files and template files.
 * @param documentationObject
 */
function integrationTransformer(handoff, documentationObject) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var outputFolder, integrationPath, destinationPath, integrationDataPath, _loop_1, _i, _c, tokenType, err_1, exportPath, exportIntegrationPath, data;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!(handoff === null || handoff === void 0 ? void 0 : handoff.integrationObject)) {
                        return [2 /*return*/];
                    }
                    console.log(chalk_1.default.green("Integration build started (using: ".concat(handoff.integrationObject.name, ")...")));
                    outputFolder = path_1.default.resolve(handoff.modulePath, '.handoff', "".concat(handoff.config.figma_project_id), 'public');
                    if (!!fs_extra_1.default.existsSync(outputFolder)) return [3 /*break*/, 2];
                    return [4 /*yield*/, fs_extra_1.default.promises.mkdir(outputFolder, { recursive: true })];
                case 1:
                    _d.sent();
                    _d.label = 2;
                case 2:
                    integrationPath = (0, exports.getPathToIntegration)(handoff, false);
                    if (!integrationPath) {
                        console.log(chalk_1.default.yellow('Unable to build integration. Reason: Unable to resolve integration path.'));
                        return [2 /*return*/];
                    }
                    destinationPath = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'integration');
                    integrationDataPath = (_b = (_a = handoff === null || handoff === void 0 ? void 0 : handoff.integrationObject) === null || _a === void 0 ? void 0 : _a.entries) === null || _b === void 0 ? void 0 : _b.integration;
                    if (!integrationDataPath) {
                        console.log(chalk_1.default.yellow('Unable to build integration. Reason: Integration entry not specified.'));
                        return [2 /*return*/];
                    }
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 5, , 6]);
                    handlebars_1.default.registerHelper("value", function (componentName, part, variant, property, options) {
                        var context = options.data.root;
                        var component = context.documentationObject.components[componentName.toLocaleLowerCase()];
                        if (!component) {
                            return new handlebars_1.default.SafeString('unset');
                        }
                        var search = variant.split(',').map(function (pair) {
                            var _a = pair.split(':'), key = _a[0], value = _a[1];
                            return [key !== null && key !== void 0 ? key : ''.trim(), value !== null && value !== void 0 ? value : ''.trim()];
                        });
                        var componentInstance = component.instances.find(function (instance) {
                            return search.every(function (_a) {
                                var searchProperty = _a[0], searchValue = _a[1];
                                return instance.variantProperties.some(function (variantProperty) {
                                    return variantProperty[0].toLocaleLowerCase() === searchProperty.toLocaleLowerCase() &&
                                        variantProperty[1].toLocaleLowerCase() === searchValue.toLocaleLowerCase();
                                });
                            });
                        });
                        if (!componentInstance) {
                            return new handlebars_1.default.SafeString('unset');
                        }
                        var partTokenSets = componentInstance.parts[''] || componentInstance.parts['$'];
                        if (!partTokenSets || partTokenSets.length === 0) {
                            return new handlebars_1.default.SafeString('unset');
                        }
                        var tokens = partTokenSets.reduce(function (prev, curr) { return (__assign(__assign({}, prev), (0, tokens_1.getTokenSetTokens)(curr))); }, {});
                        if (!tokens) {
                            return new handlebars_1.default.SafeString('unset');
                        }
                        var value = tokens[property];
                        if (!value) {
                            return new handlebars_1.default.SafeString('unset');
                        }
                        if (typeof value === 'string') {
                            return new handlebars_1.default.SafeString(value);
                        }
                        return new handlebars_1.default.SafeString(value[0]);
                    });
                    _loop_1 = function (tokenType) {
                        handlebars_1.default.registerHelper("".concat(tokenType, "-token"), function (componentName, part, variant, property, options) {
                            var context = options.data.root;
                            var component = context.documentationObject.components[componentName.toLocaleLowerCase()];
                            if (!component) {
                                return new handlebars_1.default.SafeString('unset');
                            }
                            var search = variant.split(',').map(function (pair) {
                                var _a = pair.split(':'), key = _a[0], value = _a[1];
                                return [key !== null && key !== void 0 ? key : ''.trim(), value !== null && value !== void 0 ? value : ''.trim()];
                            });
                            var componentInstance = component.instances.find(function (instance) {
                                return search.every(function (_a) {
                                    var searchProperty = _a[0], _ = _a[1];
                                    return instance.variantProperties.some(function (variantProperty) { return variantProperty[0].toLocaleLowerCase() === searchProperty.toLocaleLowerCase(); });
                                });
                            });
                            if (!componentInstance) {
                                return new handlebars_1.default.SafeString('unset');
                            }
                            return new handlebars_1.default.SafeString((0, utils_1.formatTokenName)(tokenType, componentName, search, part, property, handoff.integrationObject.options[componentName]));
                        });
                    };
                    for (_i = 0, _c = ['css', 'scss']; _i < _c.length; _i++) {
                        tokenType = _c[_i];
                        _loop_1(tokenType);
                    }
                    return [4 /*yield*/, buildIntegration(integrationDataPath, destinationPath, documentationObject)];
                case 4:
                    _d.sent();
                    console.log(chalk_1.default.green('Integration build finished successfully!'));
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _d.sent();
                    console.error(chalk_1.default.red("Unable to build integration. Reason: Error was encountered (".concat(err_1, ")")));
                    return [3 /*break*/, 6];
                case 6:
                    exportPath = path_1.default.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
                    exportIntegrationPath = path_1.default.resolve(handoff.workingPath, exportPath, "integration");
                    // copy the exported integration into the user defined dir (if the EXPORT_PATH environment variable is defined)
                    if (process.env.HANDOFF_EXPORT_PATH) {
                        fs_extra_1.default.copySync(exportIntegrationPath, process.env.HANDOFF_EXPORT_PATH);
                    }
                    // zip the tokens
                    return [4 /*yield*/, (0, exports.zipTokens)(exportPath, fs_extra_1.default.createWriteStream(path_1.default.join(outputFolder, "tokens.zip")))];
                case 7:
                    // zip the tokens
                    _d.sent();
                    data = handoff.integrationHooks.hooks.integration(documentationObject, []);
                    data = handoff.hooks.integration(documentationObject, data);
                    if (data.length > 0) {
                        data.map(function (artifact) {
                            fs_extra_1.default.writeFileSync(path_1.default.join(exportIntegrationPath, artifact.filename), artifact.data);
                        });
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.default = integrationTransformer;
var replaceHandoffImportTokens = function (content, components, currentPath, rootPath, rootReturnPath) {
    getHandoffImportTokens(components, currentPath, rootPath, rootReturnPath).forEach(function (_a) {
        var token = _a[0], imports = _a[1];
        content = content.replaceAll("//<#".concat(token, "#>"), imports.map(function (path) { return "@import '".concat(path, "';"); }).join("\r\n"));
    });
    return content;
};
var getHandoffImportTokens = function (components, currentPath, rootPath, rootReturnPath) {
    var result = [];
    components.forEach(function (component) {
        getHandoffImportTokensForComponent(component, currentPath, rootPath, rootReturnPath).forEach(function (_a, idx) {
            var _b;
            var importToken = _a[0], searchPath = _a.slice(1);
            (_b = result[idx]) !== null && _b !== void 0 ? _b : result.push([importToken, []]);
            if (fs_extra_1.default.existsSync(path_1.default.resolve.apply(path_1.default, searchPath))) {
                result[idx][1].push("".concat(searchPath[1], "/").concat(component));
            }
        });
    });
    return result;
};
var getHandoffImportTokensForComponent = function (component, currentPath, rootPath, rootReturnPath) {
    var integrationPath = path_1.default.resolve(currentPath, rootReturnPath);
    return [
        ['HANDOFF.TOKENS.TYPES', currentPath, "".concat(rootReturnPath, "tokens/types"), "".concat(component, ".scss")],
        ['HANDOFF.TOKENS.SASS', currentPath, "".concat(rootReturnPath, "tokens/sass"), "".concat(component, ".scss")],
        ['HANDOFF.TOKENS.CSS', currentPath, "".concat(rootReturnPath, "tokens/css"), "".concat(component, ".css")],
        ['HANDOFF.MAPS', rootPath, 'maps', "_".concat(component, ".scss")],
        ['HANDOFF.EXTENSIONS', rootPath, 'extended', "_".concat(component, ".scss")],
    ];
};
