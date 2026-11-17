import fs from 'fs-extra';
import path from 'path';
import type * as TS from 'typescript';
import type { Plugin } from 'vite';

/** Workspace sources whose imports follow the TypeScript config. A Vue SFC carries its script inline. */
const SOURCE_IMPORTER = /\.([cm]?tsx?|vue)$/;

/**
 * A `paths` target that TypeScript cannot resolve, because it is not a module TypeScript reads, such
 * as `@/components/Card.vue`. The pattern is substituted the way TypeScript does, and the first target
 * that names an existing file wins.
 */
const resolvePathPattern = (source: string, options: TS.CompilerOptions, configDir: string): string | undefined => {
  // TypeScript resolves `paths` from `baseUrl`, else from the directory of the config that sets them.
  const base = options.baseUrl ?? (options.pathsBasePath as string | undefined) ?? configDir;
  for (const [pattern, targets] of Object.entries(options.paths ?? {})) {
    const star = pattern.indexOf('*');
    const prefix = star < 0 ? pattern : pattern.slice(0, star);
    const suffix = star < 0 ? '' : pattern.slice(star + 1);
    const matches =
      star < 0
        ? source === pattern
        : source.startsWith(prefix) && source.endsWith(suffix) && source.length >= prefix.length + suffix.length;
    if (!matches) continue;
    const captured = star < 0 ? '' : source.slice(prefix.length, source.length - suffix.length);
    for (const target of targets) {
      const candidate = path.resolve(base, target.replace('*', captured));
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
  }
  return undefined;
};

/**
 * Resolves the workspace's TypeScript `paths` (and `baseUrl`) imports, which Vite does not read. Only
 * a workspace source file resolves this way; a package import stays with Vite. Imports in stylesheets
 * do not reach this plugin: Vite resolves them with `resolve.alias` only.
 */
export const tsconfigPathsPlugin = (ts: typeof TS, options: TS.CompilerOptions, configDir: string): Plugin => {
  const cache = ts.createModuleResolutionCache(configDir, (fileName) => fileName, options);
  return {
    name: 'handoff:tsconfig-paths',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || source.startsWith('.') || source.startsWith('\0') || path.isAbsolute(source)) return null;
      const importerFile = importer.split('?')[0];
      if (!SOURCE_IMPORTER.test(importerFile) || importerFile.split(/[\\/]/).includes('node_modules')) return null;
      const { resolvedModule } = ts.resolveModuleName(source, importerFile, options, ts.sys, cache);
      if (resolvedModule) {
        if (resolvedModule.isExternalLibraryImport || resolvedModule.resolvedFileName.endsWith('.d.ts')) return null;
        return resolvedModule.resolvedFileName;
      }
      return resolvePathPattern(source, options, configDir) ?? null;
    },
  };
};
