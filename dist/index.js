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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var path_1 = __importDefault(require("path"));
require("dotenv/config");
var app_1 = __importStar(require("./app"));
var pipeline_1 = __importStar(require("./pipeline"));
var eject_1 = require("./eject");
global.handoff = null;
var Handoff = /** @class */ (function () {
    function Handoff() {
        this.debug = false;
        this.modulePath = path_1.default.resolve(__filename, '../..');
        this.workingPath = process.cwd();
        this.config = null;
        this.hooks = {
            init: function (config) { return config; },
            fetch: function () { },
            build: function (documentationObject) { },
            typeTransformer: function (documentationObject, types) { return types; },
            integration: function (documentationObject) { },
            cssTransformer: function (documentationObject, css) { return css; },
            scssTransformer: function (documentationObject, scss) { return scss; },
            webpack: function (webpackConfig) { return webpackConfig; },
            preview: function (webpackConfig, preview) { return preview; },
            configureExportables: function (exportables) { return exportables; },
        };
        global.handoff = this;
        this.init();
    }
    Handoff.prototype.init = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var config;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, config_1.getConfig)()];
                    case 1:
                        config = _b.sent();
                        config.figma.definitions = this.hooks.configureExportables(((_a = config.figma) === null || _a === void 0 ? void 0 : _a.definitions) || []);
                        this.config = config;
                        this.config = this.hooks.init(this.config);
                        return [4 /*yield*/, (0, config_1.serializeHandoff)()];
                    case 2:
                        _b.sent();
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
                        return [4 /*yield*/, (0, pipeline_1.default)(this)];
                    case 1:
                        _a.sent();
                        this.hooks.fetch();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.integration = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, pipeline_1.buildIntegrationOnly)(this)];
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
    Handoff.prototype.exportApp = function () {
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
    Handoff.prototype.ejectConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, eject_1.ejectConfig)(this)];
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
    Handoff.prototype.configureExportables = function (callback) {
        this.hooks.configureExportables = callback;
    };
    return Handoff;
}());
exports.default = Handoff;
