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
exports.buildAndEvaluateModule = buildAndEvaluateModule;
const esbuild_1 = __importDefault(require("esbuild"));
const build_1 = require("./build");
/**
 * Builds and evaluates a module using esbuild
 * @param entryPath - Path to the module entry point
 * @param handoff - Handoff instance for configuration
 * @returns Module evaluation result with exports
 */
function buildAndEvaluateModule(entryPath, handoff) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        // Default esbuild configuration
        const defaultBuildConfig = Object.assign(Object.assign({}, build_1.DEFAULT_SSR_BUILD_CONFIG), { entryPoints: [entryPath] });
        // Apply user's SSR build config hook if provided
        const buildConfig = ((_b = (_a = handoff.config) === null || _a === void 0 ? void 0 : _a.hooks) === null || _b === void 0 ? void 0 : _b.ssrBuildConfig)
            ? handoff.config.hooks.ssrBuildConfig(defaultBuildConfig)
            : defaultBuildConfig;
        // Compile the module
        const build = yield esbuild_1.default.build(buildConfig);
        const { text: code } = build.outputFiles[0];
        // Evaluate the compiled code
        const mod = { exports: {} };
        const func = new Function('require', 'module', 'exports', code);
        func(require, mod, mod.exports);
        return mod;
    });
}
