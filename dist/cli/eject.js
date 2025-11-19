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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ejectTheme = exports.ejectPages = exports.ejectConfig = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * Eject the config to the working directory
 * @param handoff
 */
const ejectConfig = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const configPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'handoff.config.js'));
    if (fs_extra_1.default.existsSync(configPath)) {
        if (!handoff.force) {
            console.log(chalk_1.default.red(`A config already exists in the working directory.  Use the --force flag to overwrite.`));
        }
    }
    // load the template as a string
    const template = fs_extra_1.default.readFileSync(path_1.default.resolve(handoff.modulePath, 'config/config.template.js'), 'utf8');
    fs_extra_1.default.writeFileSync(configPath, template);
    console.log(chalk_1.default.green(`Config ejected to ${configPath}`));
    return handoff;
});
exports.ejectConfig = ejectConfig;
/**
 * Eject the integration to the working directory
 * @param handoff
 */
const ejectPages = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    // does an local page exist?
    const workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'pages'));
    if (fs_extra_1.default.existsSync(workingPath)) {
        if (!handoff.force) {
            console.log(chalk_1.default.yellow(`It appears you already have custom pages.  Use the --force flag to merge in any pages you haven't customized.`));
            return;
        }
    }
    const docsPath = path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config/docs'));
    fs_extra_1.default.copySync(docsPath, workingPath, { overwrite: false });
    console.log(chalk_1.default.green(`Customizable pages ejected to ${workingPath}`));
    return handoff;
});
exports.ejectPages = ejectPages;
/**
 * Eject the integration to the working directory
 * @param handoff
 */
const ejectTheme = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // does an local page exist?
    const workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'theme', 'default.scss'));
    if (fs_extra_1.default.existsSync(workingPath)) {
        if (!handoff.force) {
            console.log(chalk_1.default.yellow(`It appears you already have custom theme.  Use the --force flag to replace you haven't customized.`));
            return;
        }
    }
    const currentTheme = (_a = handoff.config.app.theme) !== null && _a !== void 0 ? _a : 'default';
    const docsPath = path_1.default.resolve(path_1.default.join(handoff.modulePath, `src/app/sass/themes/_${currentTheme}.scss`));
    if (fs_extra_1.default.existsSync(docsPath)) {
        fs_extra_1.default.copySync(docsPath, workingPath, { overwrite: false });
        console.log(chalk_1.default.green(`Customizable theme ejected to ${workingPath}`));
    }
    else {
        fs_extra_1.default.copySync(path_1.default.resolve(path_1.default.join(handoff.modulePath, `src/app/sass/themes/_default.scss`)), workingPath, { overwrite: false });
        console.log(chalk_1.default.green(`Customizable theme ejected to ${workingPath}`));
    }
    return handoff;
});
exports.ejectTheme = ejectTheme;
exports.default = exports.ejectConfig;
