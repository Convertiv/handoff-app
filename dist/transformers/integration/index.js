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
exports.zipTokens = exports.addFileToZip = exports.instantiateIntegration = exports.getIntegrationName = exports.getIntegrationEntryPoint = exports.getPathToIntegration = exports.HandoffIntegration = void 0;
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var archiver_1 = __importDefault(require("archiver"));
var config_1 = require("../../config");
var tailwind_1 = require("./tailwind");
var defaultIntegration = 'bootstrap';
var defaultVersion = '5.3';
var HandoffIntegration = /** @class */ (function () {
    function HandoffIntegration(name, version) {
        this.name = name;
        this.version = version;
        this.hooks = {
            integration: function (documentationObject, artifacts) { return artifacts; },
            webpack: function (webpackConfig) { return webpackConfig; },
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
 * Derive the path to the integration. Use the config to find the integration
 * and version.  Fall over to bootstrap 5.2.  Allow users to define custom
 * integration if desired
 */
var getPathToIntegration = function () {
    var handoff = global.handoff;
    if (!handoff || !(handoff === null || handoff === void 0 ? void 0 : handoff.config)) {
        throw Error('Handoff not initialized');
    }
    var integrationFolder = 'config/integrations';
    var defaultPath = path_1.default.resolve(path_1.default.join(handoff.modulePath, integrationFolder, defaultIntegration, defaultVersion));
    var config = handoff.config;
    if (config.integration) {
        if (config.integration.name === 'custom') {
            // Look for a custom integration
            var customPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'integration'));
            if (!fs_extra_1.default.existsSync(customPath)) {
                throw Error("The config is set to use a custom integration but no custom integration found at integrations/custom");
            }
            return customPath;
        }
        var searchPath = path_1.default.resolve(path_1.default.join(handoff.modulePath, integrationFolder, config.integration.name, config.integration.version));
        if (!fs_extra_1.default.existsSync(searchPath)) {
            throw Error("The requested integration was ".concat(config.integration.name, " version ").concat(config.integration.version, " but no integration plugin with that name was found"));
        }
        return searchPath;
    }
    return defaultPath;
};
exports.getPathToIntegration = getPathToIntegration;
/**
 * Get the entry point for the integration
 * @returns string
 */
var getIntegrationEntryPoint = function () {
    return path_1.default.resolve(path_1.default.join((0, exports.getPathToIntegration)(), 'templates', 'main.js'));
};
exports.getIntegrationEntryPoint = getIntegrationEntryPoint;
/**
 * Get the name of the current integration
 * @returns string
 */
var getIntegrationName = function () {
    var config = (0, config_1.getConfig)();
    var defaultIntegration = 'bootstrap';
    if (config.integration) {
        if (config.integration.name) {
            return config.integration.name;
        }
    }
    return defaultIntegration;
};
exports.getIntegrationName = getIntegrationName;
var instantiateIntegration = function (handoff) {
    var _a;
    if (!handoff || !(handoff === null || handoff === void 0 ? void 0 : handoff.config)) {
        throw Error('Handoff not initialized');
    }
    var config = handoff.config;
    if (config.integration) {
        switch ((_a = config === null || config === void 0 ? void 0 : config.integration) === null || _a === void 0 ? void 0 : _a.name) {
            case 'tailwind':
                var integration = new HandoffIntegration(config.integration.name, config.integration.version);
                integration.postIntegration(tailwind_1.postTailwindIntegration);
                integration.modifyWebpackConfig(tailwind_1.modifyWebpackConfigForTailwind);
                return integration;
            default:
                return new HandoffIntegration(config.integration.name, config.integration.version);
        }
    }
    return new HandoffIntegration(defaultIntegration, defaultVersion);
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
/**
 * Find the integration to sync and sync the sass files and template files.
 * @param documentationObject
 */
function integrationTransformer(documentationObject) {
    return __awaiter(this, void 0, void 0, function () {
        var handoff, outputFolder, integrationPath, sassFolder, templatesFolder, integrationsSass, integrationTemplates, mainScssFilePath, stream, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handoff = (0, config_1.getHandoff)();
                    outputFolder = path_1.default.resolve(handoff.modulePath, 'src/app/public');
                    integrationPath = (0, exports.getPathToIntegration)();
                    sassFolder = path_1.default.resolve(handoff.workingPath, "exported/integration");
                    templatesFolder = path_1.default.resolve(__dirname, '../../templates');
                    integrationsSass = path_1.default.resolve(integrationPath, 'sass');
                    integrationTemplates = path_1.default.resolve(integrationPath, 'templates');
                    fs_extra_1.default.copySync(integrationsSass, sassFolder);
                    fs_extra_1.default.copySync(integrationTemplates, templatesFolder);
                    mainScssFilePath = path_1.default.resolve(sassFolder, 'main.scss');
                    if (fs_extra_1.default.existsSync(mainScssFilePath)) {
                        fs_extra_1.default.writeFileSync(mainScssFilePath, replaceHandoffImportTokens(fs_extra_1.default.readFileSync(mainScssFilePath, 'utf8'), Object.keys(documentationObject.components)));
                    }
                    // copy the exported integration into the user defined dir (if the EXPORT_PATH environment variable is defined)
                    if (process.env.EXPORT_PATH) {
                        fs_extra_1.default.copySync(sassFolder, process.env.EXPORT_PATH);
                    }
                    stream = fs_extra_1.default.createWriteStream(path_1.default.join(outputFolder, "tokens.zip"));
                    return [4 /*yield*/, (0, exports.zipTokens)('exported', stream)];
                case 1:
                    _a.sent();
                    data = handoff.integrationHooks.hooks.integration(documentationObject, []);
                    data = handoff.hooks.integration(documentationObject, data);
                    if (data.length > 0) {
                        data.map(function (artifact) {
                            fs_extra_1.default.writeFileSync(path_1.default.join(sassFolder, artifact.filename), artifact.data);
                        });
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.default = integrationTransformer;
var replaceHandoffImportTokens = function (content, components) {
    getHandoffImportTokens(components)
        .forEach(function (_a) {
        var token = _a[0], imports = _a[1];
        content = content.replaceAll("//<#".concat(token, "#>"), imports.map(function (path) { return "@import '".concat(path, "';"); }).join("\r\n"));
    });
    return content;
};
var getHandoffImportTokens = function (components) {
    var result = [];
    components.forEach(function (component) {
        getHandoffImportTokensForComponent(component)
            .forEach(function (_a, idx) {
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
var getHandoffImportTokensForComponent = function (component) {
    var exportedIntegrationTokensPath = path_1.default.resolve((0, config_1.getHandoff)().workingPath, "exported/integration");
    return [
        ['HANDOFF.TOKENS.TYPES', exportedIntegrationTokensPath, '../tokens/types', "".concat(component, ".scss")],
        ['HANDOFF.TOKENS.SASS', exportedIntegrationTokensPath, '../tokens/sass', "".concat(component, ".scss")],
        ['HANDOFF.TOKENS.CSS', exportedIntegrationTokensPath, '../tokens/css', "".concat(component, ".css")],
        ['HANDOFF.MAPS', exportedIntegrationTokensPath, 'maps', "_".concat(component, ".scss")],
        ['HANDOFF.EXTENSIONS', exportedIntegrationTokensPath, 'extended', "_".concat(component, ".scss")]
    ];
};
