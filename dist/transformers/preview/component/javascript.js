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
const preview_1 = require("../../../utils/preview");
const component_1 = require("../component");
const buildComponentJs = (id, location, data, handoff) => __awaiter(void 0, void 0, void 0, function* () {
    // Is there a JS file with the same name?
    const outputPath = (0, component_1.getComponentOutputPath)(handoff);
    const jsFile = id + '.js';
    if (fs_extra_1.default.existsSync(path_1.default.resolve(location, jsFile))) {
        console.log(chalk_1.default.green(`Detected JS file for ${id}`));
        try {
            const jsPath = path_1.default.resolve(location, jsFile);
            const js = yield fs_extra_1.default.readFile(jsPath, 'utf8');
            const compiled = yield (0, preview_1.bundleJSWebpack)(jsPath, handoff, 'production');
            if (js) {
                data.js = js;
                data['jsCompiled'] = compiled;
                yield fs_extra_1.default.writeFile(path_1.default.resolve(outputPath, jsFile), compiled);
            }
        }
        catch (e) {
            console.log(chalk_1.default.red(`Error compiling JS for ${id}`));
            console.log(e);
        }
    }
    return data;
});
exports.default = buildComponentJs;
