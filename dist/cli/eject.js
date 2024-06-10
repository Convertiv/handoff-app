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
exports.ejectTheme = exports.ejectPages = exports.ejectExportables = exports.ejectIntegration = exports.ejectConfig = void 0;
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var chalk_1 = __importDefault(require("chalk"));
var integration_1 = require("../transformers/integration");
var config_1 = require("../config");
/**
 * Eject the config to the working directory
 * @param handoff
 */
var ejectConfig = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var config, configPath;
    return __generator(this, function (_a) {
        config = (0, config_1.getClientConfig)(handoff.config);
        configPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'handoff.config.json'));
        if (fs_extra_1.default.existsSync(configPath)) {
            if (!handoff.force) {
                console.log(chalk_1.default.red("A config already exists in the working directory.  Use the --force flag to overwrite."));
            }
        }
        fs_extra_1.default.writeFileSync(configPath, "".concat(JSON.stringify(config, null, 2)));
        console.log(chalk_1.default.green("Config ejected to ".concat(configPath)));
        return [2 /*return*/, handoff];
    });
}); };
exports.ejectConfig = ejectConfig;
/**
 * Eject the integration to the working directory
 * @param handoff
 */
var ejectIntegration = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var config, integration, workingPath, integrationPath, localConfigPath, _a, localConfigBuffer, localConfig;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                config = handoff.config;
                if (!config.integration) {
                    console.log(chalk_1.default.red("Unable to eject integration as it is not defined."));
                    return [2 /*return*/, handoff];
                }
                integration = config.integration.name;
                // is the custom integration already being used?
                if (integration === 'custom') {
                    console.log(chalk_1.default.red("Custom integration cannot be ejected as it's destination matches the source."));
                    return [2 /*return*/];
                }
                workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'integration'));
                if (fs_extra_1.default.existsSync(workingPath)) {
                    if (!handoff.force) {
                        console.log(chalk_1.default.red("An integration already exists in the working directory. Use the --force flag to overwrite."));
                        return [2 /*return*/];
                    }
                }
                integrationPath = (0, integration_1.getPathToIntegration)(handoff);
                fs_extra_1.default.copySync(integrationPath, workingPath, { overwrite: false });
                console.log(chalk_1.default.green("".concat((_b = config === null || config === void 0 ? void 0 : config.integration) === null || _b === void 0 ? void 0 : _b.name, " ").concat((_c = config === null || config === void 0 ? void 0 : config.integration) === null || _c === void 0 ? void 0 : _c.version, " ejected to ").concat(workingPath)));
                localConfigPath = path_1.default.join(handoff.workingPath, 'handoff.config.json');
                _a = !fs_extra_1.default.existsSync(localConfigPath);
                if (!_a) return [3 /*break*/, 2];
                return [4 /*yield*/, (0, exports.ejectConfig)(handoff)];
            case 1:
                _a = (_d.sent());
                _d.label = 2;
            case 2:
                _a;
                localConfigBuffer = fs_extra_1.default.readFileSync(localConfigPath);
                localConfig = JSON.parse(localConfigBuffer.toString());
                localConfig.integration = { name: 'custom', version: '' };
                fs_extra_1.default.writeFileSync(localConfigPath, "".concat(JSON.stringify(localConfig, null, 2)));
                return [2 /*return*/, handoff];
        }
    });
}); };
exports.ejectIntegration = ejectIntegration;
/**
 * Eject the integration to the working directory
 * @param handoff
 */
var ejectExportables = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var config, workingPath, integrationPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, handoff.config];
            case 1:
                config = _a.sent();
                workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'exportables'));
                if (fs_extra_1.default.existsSync(workingPath)) {
                    if (!handoff.force) {
                        console.log(chalk_1.default.yellow("It appears you already have customized the exportables.  Use the --force flag to merge in any schemas you haven't customized."));
                        return [2 /*return*/];
                    }
                }
                integrationPath = path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config/exportables'));
                fs_extra_1.default.copySync(integrationPath, workingPath, { overwrite: false });
                console.log(chalk_1.default.green("All exportables ejected to ".concat(workingPath)));
                return [2 /*return*/, handoff];
        }
    });
}); };
exports.ejectExportables = ejectExportables;
/**
 * Eject the integration to the working directory
 * @param handoff
 */
var ejectPages = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var config, workingPath, docsPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, handoff.config];
            case 1:
                config = _a.sent();
                workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'pages'));
                if (fs_extra_1.default.existsSync(workingPath)) {
                    if (!handoff.force) {
                        console.log(chalk_1.default.yellow("It appears you already have custom pages.  Use the --force flag to merge in any pages you haven't customized."));
                        return [2 /*return*/];
                    }
                }
                docsPath = path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config/docs'));
                fs_extra_1.default.copySync(docsPath, workingPath, { overwrite: false });
                console.log(chalk_1.default.green("Customizable pages ejected to ".concat(workingPath)));
                return [2 /*return*/, handoff];
        }
    });
}); };
exports.ejectPages = ejectPages;
/**
 * Eject the integration to the working directory
 * @param handoff
 */
var ejectTheme = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var workingPath, currentTheme, docsPath;
    var _a;
    return __generator(this, function (_b) {
        workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'theme', 'default.scss'));
        if (fs_extra_1.default.existsSync(workingPath)) {
            if (!handoff.force) {
                console.log(chalk_1.default.yellow("It appears you already have custom theme.  Use the --force flag to replace you haven't customized."));
                return [2 /*return*/];
            }
        }
        currentTheme = (_a = handoff.config.app.theme) !== null && _a !== void 0 ? _a : 'default';
        docsPath = path_1.default.resolve(path_1.default.join(handoff.modulePath, "src/app/sass/themes/_".concat(currentTheme, ".scss")));
        if (fs_extra_1.default.existsSync(docsPath)) {
            fs_extra_1.default.copySync(docsPath, workingPath, { overwrite: false });
            console.log(chalk_1.default.green("Customizable theme ejected to ".concat(workingPath)));
        }
        else {
            fs_extra_1.default.copySync(path_1.default.resolve(path_1.default.join(handoff.modulePath, "src/app/sass/themes/_default.scss")), workingPath, { overwrite: false });
            console.log(chalk_1.default.green("Customizable theme ejected to ".concat(workingPath)));
        }
        return [2 /*return*/, handoff];
    });
}); };
exports.ejectTheme = ejectTheme;
exports.default = exports.ejectConfig;
