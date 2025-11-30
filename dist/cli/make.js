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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeComponent = exports.makePage = exports.makeTemplate = void 0;
const p = __importStar(require("@clack/prompts"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
/**
 * Make a new exportable component
 * @param handoff
 */
const makeTemplate = (handoff, component, state) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!((_b = (_a = handoff === null || handoff === void 0 ? void 0 : handoff.runtimeConfig) === null || _a === void 0 ? void 0 : _a.entries) === null || _b === void 0 ? void 0 : _b.templates)) {
        logger_1.Logger.error(`Runtime config does not specify entry for templates.`);
        return;
    }
    if (!component) {
        logger_1.Logger.error(`Template component must be set`);
        return;
    }
    if (!state) {
        state = 'default';
    }
    if (!/^[a-z0-9]+$/i.test(component)) {
        logger_1.Logger.error(`Template component must be alphanumeric and may contain dashes or underscores`);
        return;
    }
    if (!/^[a-z0-9]+$/i.test(state)) {
        logger_1.Logger.error(`Template state must be alphanumeric and may contain dashes or underscores`);
        return;
    }
    const workingPath = path_1.default.resolve(handoff.runtimeConfig.entries.templates, component);
    if (!fs_extra_1.default.existsSync(workingPath)) {
        fs_extra_1.default.mkdirSync(workingPath, { recursive: true });
    }
    const target = path_1.default.resolve(workingPath, `${state}.html`);
    if (fs_extra_1.default.existsSync(target)) {
        if (!handoff.force) {
            logger_1.Logger.warn(`'${state}' already exists as custom template.  Use the --force flag revert it to default.`);
            return;
        }
    }
    const templatePath = path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config/templates', 'template.html'));
    const template = fs_extra_1.default.readFileSync(templatePath, 'utf8');
    fs_extra_1.default.writeFileSync(target, template);
    logger_1.Logger.success(`New template ${state}.html was created in ${workingPath}`);
    return handoff;
});
exports.makeTemplate = makeTemplate;
/**
 * Make a new docs page
 * @param handoff
 */
const makePage = (handoff, name, parent) => __awaiter(void 0, void 0, void 0, function* () {
    let type = 'md';
    if (!name) {
        logger_1.Logger.error(`Page name must be set`);
        return;
    }
    if (!/^[a-z0-9]+$/i.test(name)) {
        logger_1.Logger.error(`Page name must be alphanumeric and may contain dashes or underscores`);
        return;
    }
    let workingPath, sourcePath, templatePath;
    if (parent) {
        if (!/^[a-z0-9]+$/i.test(parent)) {
            logger_1.Logger.error(`Parent name must be alphanumeric and may contain dashes or underscores`);
            return;
        }
        workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, `pages`, parent));
        sourcePath = path_1.default.resolve(path_1.default.join(handoff.modulePath, `config/docs`, parent, `${name}.${type}`));
    }
    else {
        workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, `pages`));
        sourcePath = path_1.default.resolve(path_1.default.join(handoff.modulePath, `config/docs`, `${name}.${type}`));
    }
    if (!fs_extra_1.default.existsSync(workingPath)) {
        fs_extra_1.default.mkdirSync(workingPath, { recursive: true });
    }
    const target = path_1.default.resolve(workingPath, `${name}.${type}`);
    if (fs_extra_1.default.existsSync(target)) {
        if (!handoff.force) {
            logger_1.Logger.warn(`'${name}' already exists as custom page.  Use the --force flag revert it to default.`);
            return;
        }
    }
    templatePath = path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config/templates', `page.${type}`));
    if (fs_extra_1.default.existsSync(sourcePath)) {
        templatePath = sourcePath;
    }
    const template = fs_extra_1.default.readFileSync(templatePath, 'utf8');
    fs_extra_1.default.writeFileSync(target, template);
    logger_1.Logger.success(`New template ${name}.${type} was created in ${workingPath}`);
    return handoff;
});
exports.makePage = makePage;
/**
 * Make a new docs page
 * @param handoff
 */
const makeComponent = (handoff, name) => __awaiter(void 0, void 0, void 0, function* () {
    if (!name) {
        logger_1.Logger.error(`Component name must be set`);
        return;
    }
    const version = '1.0.0';
    name = name.replace('.html', '');
    let workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, `integration/components/${name}/${version}`));
    if (!fs_extra_1.default.existsSync(workingPath)) {
        fs_extra_1.default.mkdirSync(workingPath, { recursive: true });
    }
    const targetHtml = path_1.default.resolve(workingPath, `${name}.hbs`);
    if (fs_extra_1.default.existsSync(targetHtml)) {
        if (!handoff.force) {
            logger_1.Logger.warn(`'${name}' already exists as custom component.`);
            return;
        }
    }
    const templatePath = path_1.default.join(handoff.modulePath, 'config', 'templates/integration/components/template/1.0.0');
    const htmlPath = path_1.default.resolve(templatePath, 'template.hbs');
    const htmlTemplate = fs_extra_1.default.readFileSync(htmlPath, 'utf8');
    fs_extra_1.default.writeFileSync(targetHtml, htmlTemplate);
    logger_1.Logger.success(`New component ${name}.hbs was created in ${workingPath}`);
    const jsonpath = path_1.default.resolve(templatePath, 'template.json');
    const jsonTemplate = fs_extra_1.default.readFileSync(jsonpath, 'utf8');
    fs_extra_1.default.writeFileSync(path_1.default.resolve(workingPath, `${name}.json`), jsonTemplate);
    const writeJSFile = yield p.confirm({
        message: `Generate a supporting javascript file ${name}.js?`,
        initialValue: false,
    });
    if (writeJSFile === true) {
        logger_1.Logger.success(`Writing ${name}.js.\n`);
        const jsPath = path_1.default.resolve(templatePath, 'template.js');
        const jsTemplate = fs_extra_1.default.readFileSync(jsPath, 'utf8');
        fs_extra_1.default.writeFileSync(path_1.default.resolve(workingPath, `${name}.js`), jsTemplate);
    }
    const writeSassFile = yield p.confirm({
        message: `Generate a supporting SASS file ${name}.scss?`,
        initialValue: false,
    });
    if (writeSassFile === true) {
        logger_1.Logger.success(`Writing ${name}.scss.\n`);
        const scssPath = path_1.default.resolve(templatePath, 'template.scss');
        const scssTemplate = fs_extra_1.default.readFileSync(scssPath, 'utf8');
        fs_extra_1.default.writeFileSync(path_1.default.resolve(workingPath, `${name}.scss`), scssTemplate);
    }
    return handoff;
});
exports.makeComponent = makeComponent;
