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
import { nextBuild } from 'next/dist/cli/next-build.js';
import { nextDev } from 'next/dist/cli/next-dev.js';
import path from 'path';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import chalk from 'chalk';
var getWorkingPublicPath = function (handoff) {
    var paths = [
        path.resolve(handoff.workingPath, "public-".concat(handoff.config.figma_project_id)),
        path.resolve(handoff.workingPath, "public"),
    ];
    for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
        var path_1 = paths_1[_i];
        if (fs.existsSync(path_1)) {
            return path_1;
        }
    }
    return null;
};
var getAppPath = function (handoff) {
    return path.resolve(handoff.modulePath, '.handoff', "".concat(handoff.config.figma_project_id));
};
/**
 * Copy the public dir from the working dir to the module dir
 * @param handoff
 */
var mergePublicDir = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var appPath, workingPublicPath;
    return __generator(this, function (_a) {
        appPath = getAppPath(handoff);
        workingPublicPath = getWorkingPublicPath(handoff);
        if (workingPublicPath) {
            fs.copySync(workingPublicPath, path.resolve(appPath, 'public'), { overwrite: true });
        }
        return [2 /*return*/];
    });
}); };
var prepareProjectApp = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var srcPath, appPath, handoffProjectId, handoffAppBasePath, handoffWorkingPath, handoffModulePath, handoffExportPath, nextConfigPath, nextConfigContent;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                srcPath = path.resolve(handoff.modulePath, 'src', 'app');
                appPath = getAppPath(handoff);
                // Prepare project app dir
                return [4 /*yield*/, fs.promises.mkdir(appPath, { recursive: true })];
            case 1:
                // Prepare project app dir
                _c.sent();
                return [4 /*yield*/, fs.copy(srcPath, appPath, { overwrite: true })];
            case 2:
                _c.sent();
                return [4 /*yield*/, mergePublicDir(handoff)];
            case 3:
                _c.sent();
                handoffProjectId = (_a = handoff.config.figma_project_id) !== null && _a !== void 0 ? _a : '';
                handoffAppBasePath = (_b = handoff.config.app.base_path) !== null && _b !== void 0 ? _b : '';
                handoffWorkingPath = path.resolve(handoff.workingPath);
                handoffModulePath = path.resolve(handoff.modulePath);
                handoffExportPath = path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id);
                nextConfigPath = path.resolve(appPath, 'next.config.js');
                return [4 /*yield*/, fs.readFile(nextConfigPath, 'utf-8')];
            case 4:
                nextConfigContent = (_c.sent())
                    .replace(/basePath:\s+\'\'/g, "basePath: '".concat(handoffAppBasePath, "'"))
                    .replace(/HANDOFF_PROJECT_ID:\s+\'\'/g, "HANDOFF_PROJECT_ID: '".concat(handoffProjectId, "'"))
                    .replace(/HANDOFF_APP_BASE_PATH:\s+\'\'/g, "HANDOFF_APP_BASE_PATH: '".concat(handoffAppBasePath, "'"))
                    .replace(/HANDOFF_WORKING_PATH:\s+\'\'/g, "HANDOFF_WORKING_PATH: '".concat(handoffWorkingPath, "'"))
                    .replace(/HANDOFF_MODULE_PATH:\s+\'\'/g, "HANDOFF_MODULE_PATH: '".concat(handoffModulePath, "'"))
                    .replace(/HANDOFF_EXPORT_PATH:\s+\'\'/g, "HANDOFF_EXPORT_PATH: '".concat(handoffExportPath, "'"))
                    .replace(/%HANDOFF_MODULE_PATH%/g, handoffModulePath);
                return [4 /*yield*/, fs.writeFile(nextConfigPath, nextConfigContent)];
            case 5:
                _c.sent();
                return [2 /*return*/, appPath];
        }
    });
}); };
/**
 * Build the next js application
 * @param handoff
 * @returns
 */
var buildApp = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var appPath, outputRoot, output;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!fs.existsSync(path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
                    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
                }
                return [4 /*yield*/, prepareProjectApp(handoff)];
            case 1:
                appPath = _a.sent();
                // Build app
                return [4 /*yield*/, nextBuild({
                        lint: true,
                        mangling: true,
                        experimentalDebugMemoryUsage: false,
                        experimentalAppOnly: false,
                        experimentalTurbo: false,
                        experimentalBuildMode: 'default',
                    }, appPath)];
            case 2:
                // Build app
                _a.sent();
                outputRoot = path.resolve(handoff.workingPath, handoff.sitesDirectory);
                if (!fs.existsSync(outputRoot)) {
                    fs.mkdirSync(outputRoot, { recursive: true });
                }
                output = path.resolve(outputRoot, handoff.config.figma_project_id);
                if (fs.existsSync(output)) {
                    fs.removeSync(output);
                }
                // Copy the build files into the project output directory
                fs.copySync(path.resolve(appPath, 'out'), output);
                return [2 /*return*/];
        }
    });
}); };
/**
 * Watch the next js application
 * @param handoff
 */
export var watchApp = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var appPath, config, tsconfigPath, dev, hostname, port, app, moduleOutput, chokidarConfig, debounce;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!fs.existsSync(path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
                    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
                }
                return [4 /*yield*/, prepareProjectApp(handoff)];
            case 1:
                appPath = _a.sent();
                config = require(path.resolve(appPath, 'next.config.js'));
                // Include any changes made within the app source during watch
                chokidar
                    .watch(path.resolve(handoff.modulePath, 'src', 'app'), {
                    ignored: /(^|[\/\\])\../, // ignore dotfiles
                    persistent: true,
                    ignoreInitial: true,
                })
                    .on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _a = event;
                                switch (_a) {
                                    case 'add': return [3 /*break*/, 1];
                                    case 'change': return [3 /*break*/, 1];
                                    case 'unlink': return [3 /*break*/, 1];
                                }
                                return [3 /*break*/, 3];
                            case 1: return [4 /*yield*/, prepareProjectApp(handoff)];
                            case 2:
                                _b.sent();
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); });
                tsconfigPath = 'tsconfig.json';
                config.typescript = __assign(__assign({}, config.typescript), { tsconfigPath: tsconfigPath });
                dev = true;
                hostname = 'localhost';
                port = 3000;
                return [4 /*yield*/, nextDev(config, 'cli', appPath)];
            case 2:
                app = _a.sent();
                moduleOutput = path.resolve(appPath, 'out');
                if (fs.existsSync(moduleOutput)) {
                    fs.removeSync(moduleOutput);
                }
                chokidarConfig = {
                    ignored: /(^|[\/\\])\../, // ignore dotfiles
                    persistent: true,
                    ignoreInitial: true,
                };
                debounce = false;
                if (fs.existsSync(path.resolve(handoff.workingPath, 'exportables'))) {
                    chokidar.watch(path.resolve(handoff.workingPath, 'exportables'), chokidarConfig).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = event;
                                    switch (_a) {
                                        case 'add': return [3 /*break*/, 1];
                                        case 'change': return [3 /*break*/, 1];
                                        case 'unlink': return [3 /*break*/, 1];
                                    }
                                    return [3 /*break*/, 4];
                                case 1:
                                    if (!(path.includes('json') && !debounce)) return [3 /*break*/, 3];
                                    console.log(chalk.yellow('Exportables changed. Handoff will fetch new tokens...'));
                                    debounce = true;
                                    return [4 /*yield*/, handoff.fetch()];
                                case 2:
                                    _b.sent();
                                    debounce = false;
                                    _b.label = 3;
                                case 3: return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                }
                if (fs.existsSync(path.resolve(handoff.workingPath, 'public'))) {
                    chokidar.watch(path.resolve(handoff.workingPath, 'public'), chokidarConfig).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (event) {
                                case 'add':
                                case 'change':
                                case 'unlink':
                                    console.log(chalk.yellow('Public directory changed. Handoff will ingest the new data...'));
                                    mergePublicDir(handoff);
                                    break;
                            }
                            return [2 /*return*/];
                        });
                    }); });
                }
                if (fs.existsSync(path.resolve(handoff.workingPath, 'integration'))) {
                    chokidar.watch(path.resolve(handoff.workingPath, 'integration')).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = event;
                                    switch (_a) {
                                        case 'add': return [3 /*break*/, 1];
                                        case 'change': return [3 /*break*/, 1];
                                        case 'unlink': return [3 /*break*/, 1];
                                    }
                                    return [3 /*break*/, 4];
                                case 1:
                                    if (!(path.includes('json') && !debounce)) return [3 /*break*/, 3];
                                    console.log(chalk.yellow('Integration changed. Handoff will rerender the integrations...'));
                                    debounce = true;
                                    return [4 /*yield*/, handoff.integration()];
                                case 2:
                                    _b.sent();
                                    debounce = false;
                                    _b.label = 3;
                                case 3: return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                }
                if (fs.existsSync(path.resolve(handoff.workingPath, 'pages'))) {
                    chokidar.watch(path.resolve(handoff.workingPath, 'pages')).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            console.log(chalk.yellow('Doc page changed. Please reload browser to see changes...'));
                            return [2 /*return*/];
                        });
                    }); });
                }
                if (fs.existsSync(path.resolve(handoff.workingPath, 'handoff.config.json'))) {
                    chokidar.watch(path.resolve(handoff.workingPath, 'handoff.config.json')).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            console.log(chalk.yellow('handoff.config.json changed. Please restart server to see changes...'));
                            return [2 /*return*/];
                        });
                    }); });
                }
                return [2 /*return*/];
        }
    });
}); };
/**
 * Watch the next js application
 * @param handoff
 */
export var devApp = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var appPath, moduleOutput;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!fs.existsSync(path.resolve(handoff.workingPath, handoff.exportsDirectory, handoff.config.figma_project_id, 'tokens.json'))) {
                    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
                }
                return [4 /*yield*/, prepareProjectApp(handoff)];
            case 1:
                appPath = _a.sent();
                moduleOutput = path.resolve(appPath, 'out');
                if (fs.existsSync(moduleOutput)) {
                    fs.removeSync(moduleOutput);
                }
                return [4 /*yield*/, nextDev({ port: 3000 }, 'cli', appPath)];
            case 2: 
            // Run
            return [2 /*return*/, _a.sent()];
        }
    });
}); };
export default buildApp;
