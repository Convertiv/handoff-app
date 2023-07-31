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
exports.devApp = exports.watchApp = void 0;
var next_build_1 = require("next/dist/cli/next-build");
var next_dev_1 = require("next/dist/cli/next-dev");
var path_1 = __importDefault(require("path"));
var http_1 = require("http");
var url_1 = require("url");
var next_1 = __importDefault(require("next"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var chokidar_1 = __importDefault(require("chokidar"));
var chalk_1 = __importDefault(require("chalk"));
/**
 * Build the next js application
 * @param handoff
 * @returns
 */
var buildApp = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var output;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'exported/tokens.json'))) {
                    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
                }
                return [4 /*yield*/, (0, next_build_1.nextBuild)([path_1.default.resolve(handoff.modulePath, 'src/app')])];
            case 1:
                _a.sent();
                output = path_1.default.resolve(handoff.workingPath, 'out');
                if (fs_extra_1.default.existsSync(output)) {
                    fs_extra_1.default.removeSync(output);
                }
                fs_extra_1.default.moveSync(path_1.default.resolve(handoff.modulePath, 'src/app/out'), path_1.default.resolve(handoff.workingPath, 'out'));
                return [2 /*return*/];
        }
    });
}); };
/**
 * Watch the next js application
 * @param handoff
 */
var watchApp = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var appPath, config, tsconfigPath, dev, hostname, port, app, handle, moduleOutput, chokidarConfig, debounce;
    return __generator(this, function (_a) {
        if (!fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'exported/tokens.json'))) {
            throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
        }
        appPath = path_1.default.resolve(handoff.modulePath, 'src/app');
        config = require(path_1.default.resolve(appPath, 'next.config.js'));
        tsconfigPath = 'tsconfig.json';
        config.typescript = __assign(__assign({}, config.typescript), { tsconfigPath: tsconfigPath });
        dev = true;
        hostname = 'localhost';
        port = 3000;
        app = (0, next_1.default)({
            dev: dev,
            dir: path_1.default.resolve(handoff.modulePath, 'src/app'),
            hostname: hostname,
            port: port,
            conf: config,
        });
        handle = app.getRequestHandler();
        moduleOutput = path_1.default.resolve(appPath, 'out');
        if (fs_extra_1.default.existsSync(moduleOutput)) {
            fs_extra_1.default.removeSync(moduleOutput);
        }
        app.prepare().then(function () {
            (0, http_1.createServer)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var parsedUrl, pathname, query, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            // Be sure to pass `true` as the second argument to `url.parse`.
                            // This tells it to parse the query portion of the URL.
                            if (!req.url)
                                throw new Error('No url');
                            parsedUrl = (0, url_1.parse)(req.url, true);
                            pathname = parsedUrl.pathname, query = parsedUrl.query;
                            return [4 /*yield*/, handle(req, res, parsedUrl)];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            err_1 = _a.sent();
                            console.error('Error occurred handling', req.url, err_1);
                            res.statusCode = 500;
                            res.end('internal server error');
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); })
                .once('error', function (err) {
                console.error(err);
                process.exit(1);
            })
                .listen(port, function () {
                console.log("> Ready on http://".concat(hostname, ":").concat(port));
            });
        });
        chokidarConfig = {
            ignored: /(^|[\/\\])\../,
            persistent: true,
            ignoreInitial: true,
        };
        debounce = false;
        if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'exportables'))) {
            chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, 'exportables'), chokidarConfig).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
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
                            console.log(chalk_1.default.yellow('Exportables changed. Handoff will fetch new tokens...'));
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
        if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'integration'))) {
            chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, 'integration')).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
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
                            console.log(chalk_1.default.yellow('Integration changed. Handoff will rerender the integrations...'));
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
        if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'pages'))) {
            chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, 'pages')).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    console.log(chalk_1.default.yellow('Doc page changed. Please reload browser to see changes...'));
                    return [2 /*return*/];
                });
            }); });
        }
        if (fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'handoff.config.json'))) {
            chokidar_1.default.watch(path_1.default.resolve(handoff.workingPath, 'handoff.config.json')).on('all', function (event, path) { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    console.log(chalk_1.default.yellow('handoff.config.json changed. Please restart server to see changes...'));
                    return [2 /*return*/];
                });
            }); });
        }
        return [2 /*return*/];
    });
}); };
exports.watchApp = watchApp;
/**
 * Watch the next js application
 * @param handoff
 */
var devApp = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var appPath, moduleOutput;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!fs_extra_1.default.existsSync(path_1.default.resolve(handoff.workingPath, 'exported/tokens.json'))) {
                    throw new Error('Tokens not exported. Run `handoff-app fetch` first.');
                }
                appPath = path_1.default.resolve(handoff.modulePath, 'src', 'app');
                moduleOutput = path_1.default.resolve(appPath, 'out');
                if (fs_extra_1.default.existsSync(moduleOutput)) {
                    fs_extra_1.default.removeSync(moduleOutput);
                }
                return [4 /*yield*/, (0, next_dev_1.nextDev)([path_1.default.resolve(handoff.modulePath, 'src/app'), '-p', '3000'])];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.devApp = devApp;
exports.default = buildApp;
