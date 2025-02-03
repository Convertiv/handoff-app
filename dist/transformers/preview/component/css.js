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
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const sass_1 = __importDefault(require("sass"));
const component_1 = require("../component");
const buildComponentCss = (id, location, data, handoff, sharedStyles) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Is there a scss file with the same name?
    const outputPath = (0, component_1.getComponentOutputPath)(handoff);
    const scssFile = id + '.scss';
    const scssPath = path_1.default.resolve(location, scssFile);
    const cssFile = id + '.css';
    const cssPath = path_1.default.resolve(location, cssFile);
    if (fs_extra_1.default.existsSync(scssPath) && !fs_extra_1.default.existsSync(cssPath)) {
        console.log(chalk_1.default.green(`Detected SCSS file for ${id}`));
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
                    yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, `shared.css`), data['sharedStyles']);
                }
                else {
                    if (!sharedStyles)
                        sharedStyles = '/* These are the shared styles used in every component. */ \n\n';
                    yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, `shared.css`), sharedStyles);
                }
                yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, cssFile), data['css']);
            }
        }
        catch (e) {
            console.log(chalk_1.default.red(`Error compiling SCSS for ${id}`));
            throw e;
        }
        const scss = yield fs_extra_1.default.readFile(scssPath, 'utf8');
        if (scss) {
            data['sass'] = scss;
        }
    }
    // Is there a css file with the same name?
    if (fs_extra_1.default.existsSync(cssPath)) {
        const css = yield fs_extra_1.default.readFile(path_1.default.resolve(location, cssFile), 'utf8');
        if (css) {
            data['css'] = css;
        }
    }
    return data;
});
exports.default = buildComponentCss;
