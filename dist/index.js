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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initIntegrationObject = void 0;
var config_1 = require("./config");
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
require("dotenv/config");
var app_1 = __importStar(require("./app"));
var pipeline_1 = __importStar(require("./pipeline"));
var eject_1 = require("./cli/eject");
var make_1 = require("./cli/make");
var integration_1 = require("./transformers/integration");
var chalk_1 = __importDefault(require("chalk"));
var integration_2 = require("./utils/integration");
var preview_1 = require("./transformers/preview");
var Handoff = /** @class */ (function () {
    function Handoff(debug, force, config) {
        this.debug = false;
        this.force = false;
        this.modulePath = path_1.default.resolve(__filename, '../..');
        this.workingPath = process.cwd();
        this.exportsDirectory = 'exported';
        this.sitesDirectory = 'out';
        this.config = null;
        this.debug = debug !== null && debug !== void 0 ? debug : false;
        this.force = force !== null && force !== void 0 ? force : false;
        this.hooks = {
            init: function (config) { return config; },
            fetch: function () { },
            build: function (documentationObject) { },
            typeTransformer: function (documentationObject, types) { return types; },
            integration: function (documentationObject, data) { return data; },
            cssTransformer: function (documentationObject, css) { return css; },
            scssTransformer: function (documentationObject, scss) { return scss; },
            styleDictionaryTransformer: function (documentationObject, styleDictionary) { return styleDictionary; },
            mapTransformer: function (documentationObject, styleDictionary) { return styleDictionary; },
            webpack: function (webpackConfig) { return webpackConfig; },
            preview: function (webpackConfig, preview) { return preview; },
        };
        this.init(config);
        this.integrationHooks = (0, integration_1.instantiateIntegration)(this);
        global.handoff = this;
    }
    Handoff.prototype.init = function (configOverride) {
        var _a, _b;
        var config = initConfig(configOverride !== null && configOverride !== void 0 ? configOverride : {});
        this.config = config;
        this.config = this.hooks.init(this.config);
        this.exportsDirectory = (_a = config.exportsOutputDirectory) !== null && _a !== void 0 ? _a : this.exportsDirectory;
        this.sitesDirectory = (_b = config.sitesOutputDirectory) !== null && _b !== void 0 ? _b : this.exportsDirectory;
        this.integrationObject = (0, exports.initIntegrationObject)(this);
        return this;
    };
    Handoff.prototype.preRunner = function (validate) {
        if (!this.config) {
            throw Error('Handoff not initialized');
        }
        if (validate) {
            this.config = validateConfig(this.config);
        }
        return this;
    };
    Handoff.prototype.fetch = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        this.preRunner();
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
    Handoff.prototype.recipe = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.preRunner();
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, pipeline_1.buildRecipe)(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.snippet = function (name) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var snippetPath, sharedStyles;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.preRunner();
                        if (!this.config) return [3 /*break*/, 5];
                        if (!name) return [3 /*break*/, 3];
                        // Get snippet path
                        name = name.includes('.html') ? name : "".concat(name, ".html");
                        snippetPath = path_1.default.resolve(this.workingPath, (_a = this.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration', 'snippets', name);
                        return [4 /*yield*/, (0, preview_1.processSharedStyles)(this)];
                    case 1:
                        sharedStyles = _b.sent();
                        return [4 /*yield*/, (0, preview_1.processSnippet)(this, snippetPath, sharedStyles)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, (0, pipeline_1.buildSnippets)(this)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.renameSnippet = function (oldName, target) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.preRunner();
                if (this.config) {
                    (0, preview_1.renameSnippet)(this, oldName, target);
                }
                return [2 /*return*/, this];
            });
        });
    };
    Handoff.prototype.integration = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.preRunner();
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
                        this.preRunner(true);
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
    Handoff.prototype.ejectConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.preRunner();
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
    Handoff.prototype.ejectIntegration = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, eject_1.makeIntegration)(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.ejectExportables = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, eject_1.ejectExportables)(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.ejectPages = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, eject_1.ejectPages)(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.ejectTheme = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, eject_1.ejectTheme)(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.makeExportable = function (type, name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, make_1.makeExportable)(this, type, name)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.makeTemplate = function (component, state) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, make_1.makeTemplate)(this, component, state)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.makePage = function (name, parent) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, make_1.makePage)(this, name, parent)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.makeSnippet = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, make_1.makeSnippet)(this, name)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.makeIntegration = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, eject_1.makeIntegration)(this)];
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
                        this.preRunner(true);
                        return [4 /*yield*/, (0, app_1.watchApp)(this)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/, this];
                }
            });
        });
    };
    Handoff.prototype.dev = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config) return [3 /*break*/, 2];
                        this.preRunner(true);
                        return [4 /*yield*/, (0, app_1.devApp)(this)];
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
var initConfig = function (configOverride) {
    var config = {};
    var configPath = path_1.default.resolve(process.cwd(), 'handoff.config.json');
    if (fs_extra_1.default.existsSync(configPath)) {
        var defBuffer = fs_extra_1.default.readFileSync(configPath);
        config = JSON.parse(defBuffer.toString());
    }
    if (configOverride) {
        Object.keys(configOverride).forEach(function (key) {
            var value = configOverride[key];
            if (value !== undefined) {
                config[key] = value;
            }
        });
    }
    var returnConfig = __assign(__assign({}, (0, config_1.defaultConfig)()), config);
    return returnConfig;
};
var initIntegrationObject = function (handoff) {
    var _a, _b;
    var integrationPath = path_1.default.join(handoff.workingPath, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration');
    if (!fs_extra_1.default.existsSync(integrationPath)) {
        return null;
    }
    var integrationConfigPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, (_b = handoff.config.integrationPath) !== null && _b !== void 0 ? _b : 'integration', 'integration.config.json'));
    if (!fs_extra_1.default.existsSync(integrationConfigPath)) {
        return null;
    }
    var buffer = fs_extra_1.default.readFileSync(integrationConfigPath);
    var integration = JSON.parse(buffer.toString());
    return (0, integration_2.prepareIntegrationObject)(integration, integrationPath);
};
exports.initIntegrationObject = initIntegrationObject;
var validateConfig = function (config) {
    if (!config.figma_project_id && !process.env.HANDOFF_FIGMA_PROJECT_ID) {
        // check to see if we can get this from the env
        console.error(chalk_1.default.red('Figma project id not found in config or env. Please run `handoff-app fetch` first.'));
        throw new Error('Cannot initialize configuration');
    }
    if (!config.dev_access_token && !process.env.HANDOFF_DEV_ACCESS_TOKEN) {
        // check to see if we can get this from the env
        console.error(chalk_1.default.red('Dev access token not found in config or env. Please run `handoff-app fetch` first.'));
        throw new Error('Cannot initialize configuration');
    }
    return config;
};
exports.default = Handoff;
