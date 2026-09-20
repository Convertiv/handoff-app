import esbuild from 'esbuild';
import path from 'path';

const STYLE_EXTENSIONS = ['.css', '.scss', '.sass'];

/**
 * Keeps co-located stylesheet imports out of the JavaScript graph; the CSS pipeline compiles them.
 *
 * esbuild has no `.scss` loader, and a `.css` import fails too because these builds run with
 * `write: false` and no output path. `empty` rather than a plugin: `esbuild.buildSync` rejects
 * plugins, and the declaration and config loaders are synchronous.
 *
 * CSS Modules are not covered — the empty module leaves the class map undefined.
 */
export const STYLE_IMPORT_LOADERS: Record<string, esbuild.Loader> = Object.fromEntries(
  STYLE_EXTENSIONS.map((extension) => [extension, 'empty' as esbuild.Loader])
);

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
  loader: STYLE_IMPORT_LOADERS,
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
  loader: STYLE_IMPORT_LOADERS,
};

/** Apply after a consumer hook: a hook that replaces `loader` would otherwise drop these. */
export function withStyleLoaders<T extends esbuild.BuildOptions>(config: T): T {
  return { ...config, loader: { ...config.loader, ...STYLE_IMPORT_LOADERS } };
}

/**
 * Records each imported stylesheet once, in first-import order.
 *
 * Only the discovery build needs a plugin; elsewhere the `empty` loader is enough and a plugin would
 * rule out the synchronous callers.
 */
function createStyleCollectorPlugin(collected: string[]): esbuild.Plugin {
  const seen = new Set<string>();

  return {
    name: 'handoff-style-collector',
    setup(build) {
      build.onLoad({ filter: new RegExp(`\\.(${STYLE_EXTENSIONS.map((e) => e.slice(1)).join('|')})$`) }, (args) => {
        if (!seen.has(args.path)) {
          seen.add(args.path);
          collected.push(args.path);
        }
        return { contents: '', loader: 'js' };
      });
    },
  };
}

/**
 * Stylesheet paths imported anywhere in a component's module graph, in first-import order.
 *
 * An unbuildable graph yields an empty list rather than throwing, leaving the CSS step with the
 * declared entry.
 */
export async function collectStyleImports(entryPath: string, handoff: any): Promise<string[]> {
  const collected: string[] = [];
  const baseConfig: esbuild.BuildOptions = {
    ...DEFAULT_SSR_BUILD_CONFIG,
    entryPoints: [entryPath],
    logLevel: 'silent',
  };
  const hookedConfig = handoff?.config?.hooks?.ssrBuildConfig ? handoff.config.hooks.ssrBuildConfig(baseConfig) : baseConfig;

  try {
    await esbuild.build({
      ...withStyleLoaders(hookedConfig),
      plugins: [...(hookedConfig.plugins ?? []), createStyleCollectorPlugin(collected)],
    });
  } catch {
    return [];
  }

  return collected;
}

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
