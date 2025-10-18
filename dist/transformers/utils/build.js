"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CLIENT_BUILD_CONFIG = exports.DEFAULT_SSR_BUILD_CONFIG = void 0;
exports.resolveModule = resolveModule;
exports.createReactResolvePlugin = createReactResolvePlugin;
const path_1 = __importDefault(require("path"));
/**
 * Default esbuild configuration for SSR builds
 */
exports.DEFAULT_SSR_BUILD_CONFIG = {
    bundle: true,
    write: false,
    format: 'cjs',
    platform: 'node',
    jsx: 'automatic',
    external: ['react', 'react-dom', '@opentelemetry/api'],
};
/**
 * Default esbuild configuration for client builds
 */
exports.DEFAULT_CLIENT_BUILD_CONFIG = {
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    jsx: 'automatic',
    sourcemap: false,
    minify: false,
};
/**
 * Resolves a module from multiple search directories
 * @param id - Module ID to resolve
 * @param searchDirs - Array of directories to search in
 * @returns Resolved module path
 * @throws Error if module not found in any directory
 */
function resolveModule(id, searchDirs) {
    for (const dir of searchDirs) {
        try {
            const resolved = require.resolve(id, {
                paths: [path_1.default.resolve(dir)],
            });
            return resolved;
        }
        catch (_) {
            // skip
        }
    }
    throw new Error(`Module "${id}" not found in:\n${searchDirs.join('\n')}`);
}
/**
 * Creates an esbuild plugin for resolving React modules
 * @param workingPath - Working directory path
 * @param handoffModulePath - Handoff module path
 * @returns Esbuild plugin configuration
 */
function createReactResolvePlugin(workingPath, handoffModulePath) {
    const searchDirs = [workingPath, path_1.default.join(handoffModulePath, 'node_modules')];
    return {
        name: 'handoff-resolve-react',
        setup(build) {
            build.onResolve({ filter: /^react$/ }, () => ({
                path: resolveModule('react', searchDirs),
            }));
            build.onResolve({ filter: /^react-dom\/client$/ }, () => ({
                path: resolveModule('react-dom/client', searchDirs),
            }));
            build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => ({
                path: resolveModule('react/jsx-runtime', searchDirs),
            }));
        },
    };
}
