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
exports.makeComponent = exports.makePage = exports.makeTemplate = exports.makeExportable = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const prompt_1 = require("../utils/prompt");
/**
 * Make a new exportable component
 * @param handoff
 */
const makeExportable = (handoff, type, name) => __awaiter(void 0, void 0, void 0, function* () {
    if (type !== 'component' && type !== 'foundation') {
        console.log(chalk_1.default.red(`Exportable type must be either 'component' or 'foundation'`));
        return;
    }
    if (!/^[a-z0-9]+$/i.test(name)) {
        console.log(chalk_1.default.red(`Exportable name must be alphanumeric and may contain dashes or underscores`));
        return;
    }
    const workingPath = path_1.default.resolve(path_1.default.join(handoff.workingPath, 'exportables'));
    if (!fs_extra_1.default.existsSync(workingPath)) {
        fs_extra_1.default.mkdirSync(workingPath);
    }
    const targetDir = path_1.default.resolve(workingPath, `${type}s`);
    if (!fs_extra_1.default.existsSync(targetDir)) {
        fs_extra_1.default.mkdirSync(targetDir);
    }
    const target = path_1.default.resolve(targetDir, `${name}.json`);
    if (fs_extra_1.default.existsSync(target)) {
        if (!handoff.force) {
            console.log(chalk_1.default.yellow(`'${name}' already exists as an exportable.  Use the --force flag revert it to default.`));
            return;
        }
    }
    const templatePath = path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config/templates', 'exportable.json'));
    const template = JSON.parse(fs_extra_1.default.readFileSync(templatePath, 'utf8'));
    template.id = name;
    template.group = type.slice(0, 1).toUpperCase() + type.slice(1, type.length) + 's';
    template.options.exporter.search = name.slice(0, 1).toUpperCase() + name.slice(1, type.length);
    template.options.transformer.cssRootClass = name;
    fs_extra_1.default.writeFileSync(target, `${JSON.stringify(template, null, 2)}`);
    console.log(chalk_1.default.green(`New exportable schema ${name}.json was created in ${targetDir}`));
    return handoff;
});
exports.makeExportable = makeExportable;
/**
 * Make a new exportable component
 * @param handoff
 */
const makeTemplate = (handoff, component, state) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!((_b = (_a = handoff === null || handoff === void 0 ? void 0 : handoff.runtimeConfig) === null || _a === void 0 ? void 0 : _a.entries) === null || _b === void 0 ? void 0 : _b.templates)) {
        console.log(chalk_1.default.red(`Runtime config does not specify entry for templates.`));
        return;
    }
    if (!component) {
        console.log(chalk_1.default.red(`Template component must be set`));
        return;
    }
    if (!state) {
        state = 'default';
    }
    if (!/^[a-z0-9]+$/i.test(component)) {
        console.log(chalk_1.default.red(`Template component must be alphanumeric and may contain dashes or underscores`));
        return;
    }
    if (!/^[a-z0-9]+$/i.test(state)) {
        console.log(chalk_1.default.red(`Template state must be alphanumeric and may contain dashes or underscores`));
        return;
    }
    const workingPath = path_1.default.resolve(handoff.runtimeConfig.entries.templates, component);
    if (!fs_extra_1.default.existsSync(workingPath)) {
        fs_extra_1.default.mkdirSync(workingPath, { recursive: true });
    }
    const target = path_1.default.resolve(workingPath, `${state}.html`);
    if (fs_extra_1.default.existsSync(target)) {
        if (!handoff.force) {
            console.log(chalk_1.default.yellow(`'${state}' already exists as custom template.  Use the --force flag revert it to default.`));
            return;
        }
    }
    const templatePath = path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config/templates', 'template.html'));
    const template = fs_extra_1.default.readFileSync(templatePath, 'utf8');
    fs_extra_1.default.writeFileSync(target, template);
    console.log(chalk_1.default.green(`New template ${state}.html was created in ${workingPath}`));
    return handoff;
});
exports.makeTemplate = makeTemplate;
/**
 * Make a new docs page
 * @param handoff
 */
const makePage = (handoff, name, parent) => __awaiter(void 0, void 0, void 0, function* () {
    let type = 'mdx';
    if (!name) {
        console.log(chalk_1.default.red(`Page name must be set`));
        return;
    }
    if (!/^[a-z0-9]+$/i.test(name)) {
        console.log(chalk_1.default.red(`Page name must be alphanumeric and may contain dashes or underscores`));
        return;
    }
    const checkType = yield (0, prompt_1.prompt)(chalk_1.default.green(`By default this will create an MDX (.mdx) page supporting react components in your markdown. If you'd prefer normal markdown (.md), type 'markdown': `));
    if (checkType === 'markdown') {
        type = 'md';
    }
    let workingPath, sourcePath, templatePath;
    if (parent) {
        if (!/^[a-z0-9]+$/i.test(parent)) {
            console.log(chalk_1.default.red(`Parent name must be alphanumeric and may contain dashes or underscores`));
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
            console.log(chalk_1.default.yellow(`'${name}' already exists as custom page.  Use the --force flag revert it to default.`));
            return;
        }
    }
    templatePath = path_1.default.resolve(path_1.default.join(handoff.modulePath, 'config/templates', `page.${type}`));
    if (fs_extra_1.default.existsSync(sourcePath)) {
        templatePath = sourcePath;
    }
    const template = fs_extra_1.default.readFileSync(templatePath, 'utf8');
    fs_extra_1.default.writeFileSync(target, template);
    console.log(chalk_1.default.green(`New template ${name}.${type} was created in ${workingPath}`));
    return handoff;
});
exports.makePage = makePage;
/**
 * Make a new docs page
 * @param handoff
 */
const makeComponent = (handoff, name) => __awaiter(void 0, void 0, void 0, function* () {
    if (!name) {
        console.log(chalk_1.default.red(`Component name must be set`));
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
            console.log(chalk_1.default.yellow(`'${name}' already exists as custom component.`));
            return;
        }
    }
    const templatePath = path_1.default.join(handoff.modulePath, 'config', 'templates/integration/components/template/1.0.0');
    const htmlPath = path_1.default.resolve(templatePath, 'template.hbs');
    const htmlTemplate = fs_extra_1.default.readFileSync(htmlPath, 'utf8');
    fs_extra_1.default.writeFileSync(targetHtml, htmlTemplate);
    console.log(chalk_1.default.green(`New component ${name}.hbs was created in ${workingPath}`));
    const jsonpath = path_1.default.resolve(templatePath, 'template.json');
    const jsonTemplate = fs_extra_1.default.readFileSync(jsonpath, 'utf8');
    fs_extra_1.default.writeFileSync(path_1.default.resolve(workingPath, `${name}.json`), jsonTemplate);
    const writeJSFile = yield (0, prompt_1.prompt)(chalk_1.default.green(`Would you like us to generate a supporting javascript file ${name}.js? (y/n): `));
    if (writeJSFile === 'y') {
        console.log(chalk_1.default.green(`Writing ${name}.js.\n`));
        const jsPath = path_1.default.resolve(templatePath, 'template.js');
        const jsTemplate = fs_extra_1.default.readFileSync(jsPath, 'utf8');
        fs_extra_1.default.writeFileSync(path_1.default.resolve(workingPath, `${name}.js`), jsTemplate);
    }
    const writeSassFile = yield (0, prompt_1.prompt)(chalk_1.default.green(`Would you like us to generate a supporting SASS file ${name}.scss? (y/n): `));
    if (writeSassFile === 'y') {
        console.log(chalk_1.default.green(`Writing ${name}.scss.\n`));
        const scssPath = path_1.default.resolve(templatePath, 'template.scss');
        const scssTemplate = fs_extra_1.default.readFileSync(scssPath, 'utf8');
        fs_extra_1.default.writeFileSync(path_1.default.resolve(workingPath, `${name}.scss`), scssTemplate);
    }
    return handoff;
});
exports.makeComponent = makeComponent;
