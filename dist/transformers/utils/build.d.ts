import esbuild from 'esbuild';
/**
 * Default esbuild configuration for SSR builds
 */
export declare const DEFAULT_SSR_BUILD_CONFIG: esbuild.BuildOptions;
/**
 * Default esbuild configuration for client builds
 */
export declare const DEFAULT_CLIENT_BUILD_CONFIG: esbuild.BuildOptions;
/**
 * Resolves a module from multiple search directories
 * @param id - Module ID to resolve
 * @param searchDirs - Array of directories to search in
 * @returns Resolved module path
 * @throws Error if module not found in any directory
 */
export declare function resolveModule(id: string, searchDirs: string[]): string;
/**
 * Creates an esbuild plugin for resolving React modules
 * @param workingPath - Working directory path
 * @param handoffModulePath - Handoff module path
 * @returns Esbuild plugin configuration
 */
export declare function createReactResolvePlugin(workingPath: string, handoffModulePath: string): {
    name: string;
    setup(build: any): void;
};
