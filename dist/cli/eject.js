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
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { getPathToIntegration } from '../transformers/integration';
import { getClientConfig } from '../config';
/**
 * Eject the config to the working directory
 * @param handoff
 */
export var ejectConfig = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var config, configPath;
    return __generator(this, function (_a) {
        config = getClientConfig(handoff.config);
        configPath = path.resolve(path.join(handoff.workingPath, 'handoff.config.json'));
        if (fs.existsSync(configPath)) {
            if (!handoff.force) {
                console.log(chalk.red("A config already exists in the working directory.  Use the --force flag to overwrite."));
            }
        }
        fs.writeFileSync(configPath, "".concat(JSON.stringify(config, null, 2)));
        console.log(chalk.green("Config ejected to ".concat(configPath)));
        return [2 /*return*/, handoff];
    });
}); };
/**
 * Eject the integration to the working directory
 * @param handoff
 */
export var ejectIntegration = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var config, integration, workingPath, integrationPath, localConfigPath, _a, localConfigBuffer, localConfig;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                config = handoff.config;
                if (!config.integration) {
                    console.log(chalk.red("Unable to eject integration as it is not defined."));
                    return [2 /*return*/, handoff];
                }
                integration = config.integration.name;
                // is the custom integration already being used?
                if (integration === 'custom') {
                    console.log(chalk.red("Custom integration cannot be ejected as it's destination matches the source."));
                    return [2 /*return*/];
                }
                workingPath = path.resolve(path.join(handoff.workingPath, 'integration'));
                if (fs.existsSync(workingPath)) {
                    if (!handoff.force) {
                        console.log(chalk.red("An integration already exists in the working directory. Use the --force flag to overwrite."));
                        return [2 /*return*/];
                    }
                }
                integrationPath = getPathToIntegration(handoff);
                fs.copySync(integrationPath, workingPath, { overwrite: false });
                console.log(chalk.green("".concat((_b = config === null || config === void 0 ? void 0 : config.integration) === null || _b === void 0 ? void 0 : _b.name, " ").concat((_c = config === null || config === void 0 ? void 0 : config.integration) === null || _c === void 0 ? void 0 : _c.version, " ejected to ").concat(workingPath)));
                localConfigPath = path.join(handoff.workingPath, 'handoff.config.json');
                _a = !fs.existsSync(localConfigPath);
                if (!_a) return [3 /*break*/, 2];
                return [4 /*yield*/, ejectConfig(handoff)];
            case 1:
                _a = (_d.sent());
                _d.label = 2;
            case 2:
                _a;
                localConfigBuffer = fs.readFileSync(localConfigPath);
                localConfig = JSON.parse(localConfigBuffer.toString());
                localConfig.integration = { name: 'custom', version: '' };
                fs.writeFileSync(localConfigPath, "".concat(JSON.stringify(localConfig, null, 2)));
                return [2 /*return*/, handoff];
        }
    });
}); };
/**
 * Eject the integration to the working directory
 * @param handoff
 */
export var ejectExportables = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var config, workingPath, integrationPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, handoff.config];
            case 1:
                config = _a.sent();
                workingPath = path.resolve(path.join(handoff.workingPath, 'exportables'));
                if (fs.existsSync(workingPath)) {
                    if (!handoff.force) {
                        console.log(chalk.yellow("It appears you already have customized the exportables.  Use the --force flag to merge in any schemas you haven't customized."));
                        return [2 /*return*/];
                    }
                }
                integrationPath = path.resolve(path.join(handoff.modulePath, 'config/exportables'));
                fs.copySync(integrationPath, workingPath, { overwrite: false });
                console.log(chalk.green("All exportables ejected to ".concat(workingPath)));
                return [2 /*return*/, handoff];
        }
    });
}); };
/**
 * Eject the integration to the working directory
 * @param handoff
 */
export var ejectPages = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var config, workingPath, docsPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, handoff.config];
            case 1:
                config = _a.sent();
                workingPath = path.resolve(path.join(handoff.workingPath, 'pages'));
                if (fs.existsSync(workingPath)) {
                    if (!handoff.force) {
                        console.log(chalk.yellow("It appears you already have custom pages.  Use the --force flag to merge in any pages you haven't customized."));
                        return [2 /*return*/];
                    }
                }
                docsPath = path.resolve(path.join(handoff.modulePath, 'config/docs'));
                fs.copySync(docsPath, workingPath, { overwrite: false });
                console.log(chalk.green("Customizable pages ejected to ".concat(workingPath)));
                return [2 /*return*/, handoff];
        }
    });
}); };
/**
 * Eject the integration to the working directory
 * @param handoff
 */
export var ejectTheme = function (handoff) { return __awaiter(void 0, void 0, void 0, function () {
    var workingPath, currentTheme, docsPath;
    var _a;
    return __generator(this, function (_b) {
        workingPath = path.resolve(path.join(handoff.workingPath, 'theme', 'default.scss'));
        if (fs.existsSync(workingPath)) {
            if (!handoff.force) {
                console.log(chalk.yellow("It appears you already have custom theme.  Use the --force flag to replace you haven't customized."));
                return [2 /*return*/];
            }
        }
        currentTheme = (_a = handoff.config.app.theme) !== null && _a !== void 0 ? _a : 'default';
        docsPath = path.resolve(path.join(handoff.modulePath, "src/app/sass/themes/_".concat(currentTheme, ".scss")));
        if (fs.existsSync(docsPath)) {
            fs.copySync(docsPath, workingPath, { overwrite: false });
            console.log(chalk.green("Customizable theme ejected to ".concat(workingPath)));
        }
        else {
            fs.copySync(path.resolve(path.join(handoff.modulePath, "src/app/sass/themes/_default.scss")), workingPath, { overwrite: false });
            console.log(chalk.green("Customizable theme ejected to ".concat(workingPath)));
        }
        return [2 /*return*/, handoff];
    });
}); };
export default ejectConfig;
