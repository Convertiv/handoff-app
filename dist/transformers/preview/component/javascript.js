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
exports.buildMainJS = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const index_1 = require("../../../index");
const preview_1 = require("../../../utils/preview");
const component_1 = require("../component");
const buildComponentJs = (data, handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = data.id;
    const entry = (_a = data.entries) === null || _a === void 0 ? void 0 : _a.js;
    if (!entry) {
        return data;
    }
    // Is there a JS file with the same name?
    const outputPath = (0, component_1.getComponentOutputPath)(handoff);
    if (fs_extra_1.default.existsSync(path_1.default.resolve(entry))) {
        try {
            const js = yield fs_extra_1.default.readFile(entry, 'utf8');
            const compiled = yield (0, preview_1.bundleJSWebpack)(entry, handoff, 'production');
            if (js) {
                data.js = js;
                data['jsCompiled'] = compiled;
                yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, path_1.default.basename(entry)), compiled);
            }
        }
        catch (e) {
            console.log(chalk_1.default.red(`Error compiling JS for ${id}`));
            console.log(e);
        }
    }
    return data;
});
/**
 * Check to see if there's an entry point for the main JS file
 * build that javascript and write it to the output folder
 * @param handoff
 */
const buildMainJS = (handoff) => __awaiter(void 0, void 0, void 0, function* () {
    const outputPath = (0, component_1.getComponentOutputPath)(handoff);
    const integration = (0, index_1.initIntegrationObject)(handoff);
    if (integration && integration.entries.bundle && fs_extra_1.default.existsSync(path_1.default.resolve(integration.entries.bundle))) {
        console.log(chalk_1.default.green(`Detected main JS file`));
        try {
            const jsPath = path_1.default.resolve(integration.entries.bundle);
            const compiled = yield (0, preview_1.bundleJSWebpack)(jsPath, handoff, 'production');
            yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, 'main.js'), compiled);
        }
        catch (e) {
            console.log(chalk_1.default.red(`Error compiling main JS`));
            console.log(e);
        }
    }
});
exports.buildMainJS = buildMainJS;
exports.default = buildComponentJs;
