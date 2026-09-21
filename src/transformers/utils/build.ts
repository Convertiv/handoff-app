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
 * Stylesheets of the module graph in cascade order: every import of a module before the module
 * itself, siblings in source order.
 *
 * This is the order a bundler emits CSS in, and the cascade depends on it. A component that
 * overrides a rule of a component it imports ties that rule on specificity, so the later of the
 * two wins. esbuild's `onLoad` callbacks do not give this order: they fire roughly breadth-first,
 * which puts a component's own stylesheet ahead of the ones it imports and reverses every such
 * override.
 */
function orderStyleImports(metafile: esbuild.Metafile, entryPath: string): string[] {
  const entryKey = Object.keys(metafile.inputs).find((key) => path.resolve(key) === entryPath);
  if (!entryKey) return [];

  const ordered: string[] = [];
  const visited = new Set<string>();

  const visit = (key: string) => {
    if (visited.has(key)) return;
    visited.add(key);

    for (const imported of metafile.inputs[key]?.imports ?? []) {
      if (!imported.external && metafile.inputs[imported.path]) visit(imported.path);
    }

    if (STYLE_EXTENSIONS.includes(path.extname(key))) ordered.push(path.resolve(key));
  };

  visit(entryKey);

  return ordered;
}

/**
 * Stylesheet paths imported anywhere in a component's module graph, in cascade order.
 *
 * An unbuildable graph yields an empty list rather than throwing, leaving the CSS step with the
 * declared entry.
 */
export async function collectStyleImports(entryPath: string, handoff: any): Promise<string[]> {
  const baseConfig: esbuild.BuildOptions = {
    ...DEFAULT_SSR_BUILD_CONFIG,
    entryPoints: [entryPath],
    logLevel: 'silent',
  };
  const hookedConfig = handoff?.config?.hooks?.ssrBuildConfig ? handoff.config.hooks.ssrBuildConfig(baseConfig) : baseConfig;

  try {
    // The `empty` loader keeps stylesheets out of the JavaScript, and the metafile still records
    // them as inputs, so the graph carries the order.
    const result = await esbuild.build({ ...withStyleLoaders(hookedConfig), metafile: true });

    return result.metafile ? orderStyleImports(result.metafile, entryPath) : [];
  } catch {
    return [];
  }
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
