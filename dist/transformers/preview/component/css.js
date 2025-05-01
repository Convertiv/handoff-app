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
exports.buildMainCss = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const sass_1 = __importDefault(require("sass"));
const index_1 = require("../../../index");
const component_1 = require("../component");
const buildComponentCss = (data, handoff, sharedStyles) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const id = data.id;
    const entry = (_a = data.entries) === null || _a === void 0 ? void 0 : _a.scss;
    if (!entry) {
        return data;
    }
    const extension = path_1.default.extname(entry);
    if (!extension) {
        return data;
    }
    // Is there a scss file with the same name?
    const outputPath = (0, component_1.getComponentOutputPath)(handoff);
    if (extension === '.scss') {
        try {
            const loadPaths = [
                path_1.default.resolve(handoff.workingPath),
                path_1.default.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
                path_1.default.resolve(handoff.workingPath, 'node_modules'),
            ];
            if ((_c = (_b = handoff.integrationObject) === null || _b === void 0 ? void 0 : _b.entries) === null || _c === void 0 ? void 0 : _c.integration) {
                loadPaths.unshift(path_1.default.dirname(handoff.integrationObject.entries.integration));
            }
            const result = yield sass_1.default.compileAsync(entry, {
                loadPaths,
                quietDeps: true,
                silenceDeprecations: ['import'],
            });
            if (result.css) {
                // @ts-ignore
                data['css'] = result.css;
                // Split the CSS into shared styles and component styles
                const splitCSS = (_d = data['css']) === null || _d === void 0 ? void 0 : _d.split('/* COMPONENT STYLES*/');
                // If there are two parts, the first part is the shared styles
                if (splitCSS && splitCSS.length > 1) {
                    data['css'] = splitCSS[1];
                    data['sharedStyles'] = splitCSS[0];
                    yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, `shared.css`), data['sharedStyles']);
                }
                else {
                    if (!sharedStyles)
                        sharedStyles = '/* These are the shared styles used in every component. */ \n\n';
                    yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, `shared.css`), sharedStyles);
                }
                yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, path_1.default.basename(entry).replace('.scss', '.css')), data['css']);
            }
        }
        catch (e) {
            console.log(chalk_1.default.red(`Error compiling SCSS for ${id}`));
            throw e;
        }
        const scss = yield fs_extra_1.default.readFile(entry, 'utf8');
        if (scss) {
            data['sass'] = scss;
        }
    }
    // Is there a css file with the same name?
    if (extension === 'css') {
        const css = yield fs_extra_1.default.readFile(path_1.default.resolve(entry), 'utf8');
        if (css) {
            data['css'] = css;
        }
    }
    return data;
});
/**
 * Check to see if there's an entry point for the main JS file
 * build that javascript and write it to the output folder
 * @param handoff
 */
const buildMainCss = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    const outputPath = (0, component_1.getComponentOutputPath)(handoff);
    const integration = (0, index_1.initIntegrationObject)(handoff)[0];
    if (integration && integration.entries.integration && fs_extra_1.default.existsSync(integration.entries.integration)) {
        const stat = yield fs_extra_1.default.stat(integration.entries.integration);
        const entryPath = stat.isDirectory() ? path_1.default.resolve(integration.entries.integration, 'main.scss') : integration.entries.integration;
        if (entryPath === integration.entries.integration || fs_extra_1.default.existsSync(entryPath)) {
            console.log(chalk_1.default.green(`Detected main CSS file`));
            try {
                const scssPath = path_1.default.resolve(integration.entries.integration);
                const loadPaths = [
                    path_1.default.resolve(handoff.workingPath),
                    path_1.default.resolve(handoff.workingPath, 'exported', handoff.config.figma_project_id),
                    path_1.default.resolve(handoff.workingPath, 'node_modules'),
                ];
                if ((_f = (_e = handoff.integrationObject) === null || _e === void 0 ? void 0 : _e.entries) === null || _f === void 0 ? void 0 : _f.integration) {
                    loadPaths.unshift(path_1.default.dirname(handoff.integrationObject.entries.integration));
                }
                const result = yield sass_1.default.compileAsync(scssPath, {
                    loadPaths,
                    quietDeps: true,
                });
                yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, 'main.css'), result.css);
            }
            catch (e) {
                console.log(chalk_1.default.red(`Error compiling main CSS`));
                console.log(e);
            }
        }
    }
});
exports.buildMainCss = buildMainCss;
exports.default = buildComponentCss;
