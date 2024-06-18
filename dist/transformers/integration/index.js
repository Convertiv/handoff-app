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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import { modifyWebpackConfigForTailwind, postTailwindIntegration } from './tailwind';
var defaultIntegration = 'bootstrap';
var defaultVersion = '5.3';
var HandoffIntegration = /** @class */ (function () {
    function HandoffIntegration(name, version) {
        this.name = name;
        this.version = version;
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
export { HandoffIntegration };
/**
 * Derive the path to the integration. Use the config to find the integration
 * and version.  Allow users to define custom integration if desired.
 */
export var getPathToIntegration = function (handoff) {
    if (!handoff || !(handoff === null || handoff === void 0 ? void 0 : handoff.config)) {
        throw Error('Handoff not initialized');
    }
    var integrationFolder = 'config/integrations';
    var config = handoff.config;
    if (!config.integration) {
        return null;
    }
    if (config.integration.name === 'custom') {
        // Look for a custom integration
        var customPath = path.resolve(path.join(handoff.workingPath, 'integration'));
        if (!fs.existsSync(customPath)) {
            throw Error("The config is set to use a custom integration but no custom integration found at integrations/custom");
        }
        return customPath;
    }
    var searchPath = path.resolve(path.join(handoff.modulePath, integrationFolder, config.integration.name, config.integration.version));
    if (!fs.existsSync(searchPath)) {
        throw Error("The requested integration was ".concat(config.integration.name, " version ").concat(config.integration.version, " but no integration plugin with that name was found"));
    }
    return searchPath;
};
/**
 * Get the entry point for the integration
 * @returns string
 */
export var getIntegrationEntryPoint = function (handoff) {
    var integrationPath = getPathToIntegration(handoff);
    return integrationPath
        ? path.resolve(path.join(integrationPath, 'templates', 'main.js'))
        : null;
};
export var instantiateIntegration = function (handoff) {
    var _a;
    if (!handoff || !(handoff === null || handoff === void 0 ? void 0 : handoff.config)) {
        throw Error('Handoff not initialized');
    }
    var config = handoff.config;
    if (config.integration) {
        switch ((_a = config === null || config === void 0 ? void 0 : config.integration) === null || _a === void 0 ? void 0 : _a.name) {
            case 'tailwind':
                var integration = new HandoffIntegration(config.integration.name, config.integration.version);
                integration.postIntegration(postTailwindIntegration);
                integration.modifyWebpackConfig(modifyWebpackConfigForTailwind);
                return integration;
            default:
                return new HandoffIntegration(config.integration.name, config.integration.version);
        }
    }
    return new HandoffIntegration(defaultIntegration, defaultVersion);
};
/**
 * A recusrive function for building a zip of the tokens
 * @param directory
 * @param dirPath
 * @param archive
 * @returns
 */
export var addFileToZip = function (directory, dirPath, archive) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, directory_1, file, pathFile, recurse, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _i = 0, directory_1 = directory;
                _a.label = 1;
            case 1:
                if (!(_i < directory_1.length)) return [3 /*break*/, 6];
                file = directory_1[_i];
                pathFile = path.join(dirPath, file);
                if (!fs.lstatSync(pathFile).isDirectory()) return [3 /*break*/, 4];
                return [4 /*yield*/, fs.readdir(pathFile)];
            case 2:
                recurse = _a.sent();
                return [4 /*yield*/, addFileToZip(recurse, pathFile, archive)];
            case 3:
                archive = _a.sent();
                return [3 /*break*/, 5];
            case 4:
                data = fs.readFileSync(pathFile, 'utf-8');
                archive.append(data, { name: pathFile });
                _a.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 1];
            case 6: return [2 /*return*/, archive];
        }
    });
}); };
/**
 * Zip the fonts for download
 * @param dirPath
 * @param destination
 * @returns
 */
export var zipTokens = function (dirPath, destination) { return __awaiter(void 0, void 0, void 0, function () {
    var archive, directory;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                archive = archiver('zip', {
                    zlib: { level: 9 }, // Sets the compression level.
                });
                // good practice to catch this error explicitly
                archive.on('error', function (err) {
                    throw err;
                });
                archive.pipe(destination);
                return [4 /*yield*/, fs.readdir(dirPath)];
            case 1:
                directory = _a.sent();
                return [4 /*yield*/, addFileToZip(directory, dirPath, archive)];
            case 2:
                archive = _a.sent();
                return [4 /*yield*/, archive.finalize()];
            case 3:
                _a.sent();
                return [2 /*return*/, destination];
        }
    });
}); };
/**
 * Find the integration to sync and sync the sass files and template files.
 * @param documentationObject
 */
export default function integrationTransformer(handoff, documentationObject) {
    return __awaiter(this, void 0, void 0, function () {
        var outputFolder, integrationPath, exportedFolder, sassFolder, templatesFolder, integrationsSass, integrationTemplates, mainScssFilePath, stream, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    outputFolder = path.resolve(handoff.modulePath, '.handoff', "".concat(handoff.config.figma_project_id), 'public');
                    if (!!fs.existsSync(outputFolder)) return [3 /*break*/, 2];
                    return [4 /*yield*/, fs.promises.mkdir(outputFolder, { recursive: true })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    integrationPath = getPathToIntegration(handoff);
                    exportedFolder = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
                    sassFolder = path.resolve(handoff.workingPath, exportedFolder, "integration");
                    templatesFolder = path.resolve(__dirname, '../../templates');
                    integrationsSass = path.resolve(integrationPath, 'sass');
                    integrationTemplates = path.resolve(integrationPath, 'templates');
                    // clean dest
                    fs.removeSync(sassFolder);
                    fs.removeSync(templatesFolder);
                    // copy to dest
                    fs.copySync(integrationsSass, sassFolder);
                    fs.copySync(integrationTemplates, templatesFolder);
                    mainScssFilePath = path.resolve(sassFolder, 'main.scss');
                    if (fs.existsSync(mainScssFilePath)) {
                        fs.writeFileSync(mainScssFilePath, replaceHandoffImportTokens(handoff, fs.readFileSync(mainScssFilePath, 'utf8'), Object.keys(documentationObject.components)));
                    }
                    // copy the exported integration into the user defined dir (if the EXPORT_PATH environment variable is defined)
                    if (process.env.HANDOFF_EXPORT_PATH) {
                        fs.copySync(sassFolder, process.env.HANDOFF_EXPORT_PATH);
                    }
                    stream = fs.createWriteStream(path.join(outputFolder, "tokens.zip"));
                    return [4 /*yield*/, zipTokens(exportedFolder, stream)];
                case 3:
                    _a.sent();
                    data = handoff.integrationHooks.hooks.integration(documentationObject, []);
                    data = handoff.hooks.integration(documentationObject, data);
                    if (data.length > 0) {
                        data.map(function (artifact) {
                            fs.writeFileSync(path.join(sassFolder, artifact.filename), artifact.data);
                        });
                    }
                    return [2 /*return*/];
            }
        });
    });
}
var replaceHandoffImportTokens = function (handoff, content, components) {
    getHandoffImportTokens(handoff, components)
        .forEach(function (_a) {
        var token = _a[0], imports = _a[1];
        content = content.replaceAll("//<#".concat(token, "#>"), imports.map(function (path) { return "@import '".concat(path, "';"); }).join("\r\n"));
    });
    return content;
};
var getHandoffImportTokens = function (handoff, components) {
    var result = [];
    components.forEach(function (component) {
        getHandoffImportTokensForComponent(handoff, component)
            .forEach(function (_a, idx) {
            var _b;
            var importToken = _a[0], searchPath = _a.slice(1);
            (_b = result[idx]) !== null && _b !== void 0 ? _b : result.push([importToken, []]);
            if (fs.existsSync(path.resolve.apply(path, searchPath))) {
                result[idx][1].push("".concat(searchPath[1], "/").concat(component));
            }
        });
    });
    return result;
};
var getHandoffImportTokensForComponent = function (handoff, component) {
    var integrationPath = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'integration');
    return [
        ['HANDOFF.TOKENS.TYPES', integrationPath, '../tokens/types', "".concat(component, ".scss")],
        ['HANDOFF.TOKENS.SASS', integrationPath, '../tokens/sass', "".concat(component, ".scss")],
        ['HANDOFF.TOKENS.CSS', integrationPath, '../tokens/css', "".concat(component, ".css")],
        ['HANDOFF.MAPS', integrationPath, 'maps', "_".concat(component, ".scss")],
        ['HANDOFF.EXTENSIONS', integrationPath, 'extended', "_".concat(component, ".scss")]
    ];
};
