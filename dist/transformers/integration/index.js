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
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import { getConfig, getHandoff } from '../../config';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = basename(process.cwd());
/**
 * Derive the path to the integration. Use the config to find the integration
 * and version.  Fall over to bootstrap 5.2.  Allow users to define custom
 * integration if desired
 */
export var getPathToIntegration = function () {
    var handoff = global.handoff;
    if (!handoff || !(handoff === null || handoff === void 0 ? void 0 : handoff.config)) {
        throw Error('Handoff not initialized');
    }
    var integrationFolder = 'config/integrations';
    var defaultIntegration = 'bootstrap';
    var defaultVersion = '5.2';
    var defaultPath = path.resolve(path.join(handoff.modulePath, integrationFolder, defaultIntegration, defaultVersion));
    var config = handoff.config;
    if (config.integration) {
        if (config.integration.name === 'custom') {
            // Look for a custom integration
            var customPath = path.resolve(path.join(handoff.workingPath, integrationFolder));
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
    }
    return defaultPath;
};
/**
 * Get the entry point for the integration
 * @returns string
 */
export var getIntegrationEntryPoint = function () {
    return path.resolve(path.join(getPathToIntegration(), 'templates', 'main.js'));
};
/**
 * Get the name of the current integration
 * @returns string
 */
export var getIntegrationName = function () {
    var config = getConfig();
    var defaultIntegration = 'bootstrap';
    if (config.integration) {
        if (config.integration.name) {
            return config.integration.name;
        }
    }
    return defaultIntegration;
};
/**
 * Find the integration to sync and sync the sass files and template files.
 * @param documentationObject
 */
export default function integrationTransformer(documentationObject) {
    return __awaiter(this, void 0, void 0, function () {
        var outputFolder, integrationPath, integrationName, sassFolder, templatesFolder, integrationsSass, integrationTemplates, stream, handoff;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    outputFolder = path.join('public');
                    integrationPath = getPathToIntegration();
                    integrationName = getIntegrationName();
                    sassFolder = "exported/".concat(integrationName, "-tokens");
                    templatesFolder = path.resolve(__dirname, '../../templates');
                    integrationsSass = path.resolve(integrationPath, 'sass');
                    integrationTemplates = path.resolve(integrationPath, 'templates');
                    fs.copySync(integrationsSass, sassFolder);
                    fs.copySync(integrationTemplates, templatesFolder);
                    stream = fs.createWriteStream(path.join(outputFolder, "tokens.zip"));
                    return [4 /*yield*/, zipTokens('exported', stream)];
                case 1:
                    _a.sent();
                    handoff = getHandoff();
                    handoff.hooks.integration(documentationObject);
                    return [2 /*return*/];
            }
        });
    });
}
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
