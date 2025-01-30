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
exports.processComponent = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const sass_1 = __importDefault(require("sass"));
const preview_1 = require("../../../utils/preview");
const types_1 = require("../types");
const html_1 = __importDefault(require("./html"));
/**
 * Process process a specific component
 * @param handoff
 * @param file
 * @param sharedStyles
 */
function processComponent(handoff, file, sharedStyles, version) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let id = path_1.default.basename(file).replace('.hbs', '');
        let data = {
            id,
            title: 'Untitled',
            description: 'No description provided',
            preview: 'No preview available',
            type: types_1.ComponentType.Element,
            group: 'default',
            should_do: [],
            should_not_do: [],
            tags: [],
            previews: [
                {
                    title: 'Default',
                    values: {},
                    url: file,
                },
            ],
            properties: {},
            code: '',
            html: '',
            js: null,
            css: null,
            sass: null,
            sharedStyles: sharedStyles,
        };
        console.log(chalk_1.default.green(`Processing component ${file} ${version}`));
        const componentPath = path_1.default.resolve(handoff.workingPath, `integration/components`, id);
        if (!version) {
            // find latest version
            const versions = fs_extra_1.default.readdirSync(componentPath).filter((f) => fs_extra_1.default.statSync(path_1.default.join(componentPath, f)).isDirectory());
            const latest = versions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop();
            if (!latest) {
                throw new Error(`No version found for ${id}0`);
            }
            version = latest;
        }
        const custom = version ? path_1.default.resolve(componentPath, version) : componentPath;
        if (!fs_extra_1.default.existsSync(custom)) {
            throw new Error(`No version found for ${id}1`);
        }
        const publicPath = path_1.default.resolve(handoff.workingPath, `public/api/component`);
        // Ensure the public API path exists
        if (!fs_extra_1.default.existsSync(publicPath)) {
            fs_extra_1.default.mkdirSync(publicPath, { recursive: true });
        }
        // Is there a JSON file with the same name?
        const jsonFile = id + '.json';
        const jsonPath = path_1.default.resolve(custom, jsonFile);
        let parsed = {};
        if (fs_extra_1.default.existsSync(jsonPath)) {
            const json = yield fs_extra_1.default.readFile(jsonPath, 'utf8');
            if (json) {
                try {
                    parsed = JSON.parse(json);
                    // The JSON file defines each of the fields
                    if (parsed) {
                        data.title = parsed.title;
                        data.should_do = parsed.should_do || [];
                        data.should_not_do = parsed.should_not_do || [];
                        data.type = parsed.type || types_1.ComponentType.Element;
                        data.group = parsed.group || 'default';
                        data.tags = parsed.tags || [];
                        data.description = parsed.description;
                        data.properties = parsed.properties;
                        data.previews = parsed.previews;
                    }
                }
                catch (e) {
                    console.log(chalk_1.default.red(`Error parsing JSON for ${file}`));
                    console.log(e);
                }
            }
        }
        // Is there a JS file with the same name?
        const jsFile = id + '.js';
        if (fs_extra_1.default.existsSync(path_1.default.resolve(custom, jsFile))) {
            console.log(chalk_1.default.green(`Detected JS file for ${file}`));
            try {
                const jsPath = path_1.default.resolve(custom, jsFile);
                const js = yield fs_extra_1.default.readFile(jsPath, 'utf8');
                const compiled = yield (0, preview_1.bundleJSWebpack)(jsPath, handoff, 'development');
                if (js) {
                    data.js = js;
                    data['jsCompiled'] = compiled;
                    yield fs_extra_1.default.writeFile(path_1.default.resolve(publicPath, jsFile), compiled);
                }
            }
            catch (e) {
                console.log(chalk_1.default.red(`Error compiling JS for ${file}`));
                console.log(e);
            }
        }
        // Is there a scss file with the same name?
        const scssFile = id + '.scss';
        const scssPath = path_1.default.resolve(custom, scssFile);
        const cssFile = id + '.css';
        const cssPath = path_1.default.resolve(custom, cssFile);
        if (fs_extra_1.default.existsSync(scssPath) && !fs_extra_1.default.existsSync(cssPath)) {
            console.log(chalk_1.default.green(`Detected SCSS file for ${file}`));
            try {
                const result = yield sass_1.default.compileAsync(scssPath, {
                    loadPaths: [
                        path_1.default.resolve(handoff.workingPath, (_a = handoff.config.integrationPath) !== null && _a !== void 0 ? _a : 'integration', 'sass'),
                        path_1.default.resolve(handoff.workingPath, 'node_modules'),
                        path_1.default.resolve(handoff.workingPath),
                        path_1.default.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
                    ],
                });
                if (result.css) {
                    // @ts-ignore
                    data['css'] = result.css;
                    // Split the CSS into shared styles and component styles
                    const splitCSS = (_b = data['css']) === null || _b === void 0 ? void 0 : _b.split('/* COMPONENT STYLES*/');
                    // If there are two parts, the first part is the shared styles
                    if (splitCSS && splitCSS.length > 1) {
                        data['css'] = splitCSS[1];
                        data['sharedStyles'] = splitCSS[0];
                        yield fs_extra_1.default.writeFile(path_1.default.resolve(publicPath, `shared.css`), data['sharedStyles']);
                    }
                    else {
                        if (!sharedStyles)
                            sharedStyles = '/* These are the shared styles used in every component. */ \n\n';
                        yield fs_extra_1.default.writeFile(path_1.default.resolve(publicPath, `shared.css`), sharedStyles);
                    }
                    yield fs_extra_1.default.writeFile(path_1.default.resolve(publicPath, cssFile), data['css']);
                }
            }
            catch (e) {
                console.log(chalk_1.default.red(`Error compiling SCSS for ${file}`));
                throw e;
            }
            const scss = yield fs_extra_1.default.readFile(scssPath, 'utf8');
            if (scss) {
                data['sass'] = scss;
            }
        }
        // Is there a css file with the same name?
        if (fs_extra_1.default.existsSync(cssPath)) {
            const css = yield fs_extra_1.default.readFile(path_1.default.resolve(custom, cssFile), 'utf8');
            if (css) {
                data['css'] = css;
            }
        }
        data = yield (0, html_1.default)(data, id, custom, publicPath, handoff);
        data.sharedStyles = sharedStyles;
        return data;
    });
}
exports.processComponent = processComponent;
exports.default = processComponent;
