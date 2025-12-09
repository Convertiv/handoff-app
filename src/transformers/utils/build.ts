import esbuild from 'esbuild';
import path from 'path';

/**
 * Default esbuild configuration for SSR builds
 */
export const DEFAULT_SSR_BUILD_CONFIG: esbuild.BuildOptions = {
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
export const DEFAULT_CLIENT_BUILD_CONFIG: esbuild.BuildOptions = {
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
export function resolveModule(id: string, searchDirs: string[]): string {
  for (const dir of searchDirs) {
    try {
      const resolved = require.resolve(id, {
        paths: [path.resolve(dir)],
      });
      return resolved;
    } catch (_) {
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
export function createReactResolvePlugin(workingPath: string, handoffModulePath: string) {
  const searchDirs = [workingPath, path.join(handoffModulePath, 'node_modules')];

  return {
    name: 'handoff-resolve-react',
    setup(build: any) {
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
