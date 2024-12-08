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
exports.getComponentTemplate = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * Get the component template
 * @param component
 * @param parts
 * @returns
 */
const getComponentTemplate = (handoff, component, parts) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!((_b = (_a = handoff === null || handoff === void 0 ? void 0 : handoff.integrationObject) === null || _a === void 0 ? void 0 : _a.entries) === null || _b === void 0 ? void 0 : _b.templates)) {
        return null;
    }
    const sources = [
        path_1.default.resolve(handoff.integrationObject.entries.templates, component),
    ];
    for (const src of sources) {
        let cwd = src;
        let srcParts = [...parts];
        let templatePath = undefined;
        while (srcParts.length > 0) {
            let pathToDir = path_1.default.resolve(cwd, srcParts[0]);
            let pathToFile = path_1.default.resolve(cwd, `${srcParts[0]}.html`);
            if (fs_extra_1.default.pathExistsSync(pathToFile)) {
                templatePath = pathToFile;
            }
            if (fs_extra_1.default.pathExistsSync(pathToDir)) {
                cwd = pathToDir;
            }
            else if (templatePath) {
                break;
            }
            srcParts.shift();
        }
        if (templatePath) {
            return yield fs_extra_1.default.readFile(templatePath, 'utf8');
        }
    }
    for (const src of sources) {
        const templatePath = path_1.default.resolve(src, `default.html`);
        if (yield fs_extra_1.default.pathExists(templatePath)) {
            return yield fs_extra_1.default.readFile(templatePath, 'utf8');
        }
    }
    return null;
});
exports.getComponentTemplate = getComponentTemplate;
