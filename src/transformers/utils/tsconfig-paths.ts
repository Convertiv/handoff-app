import fs from 'fs-extra';
import path from 'path';
import type * as TS from 'typescript';
import type { Plugin } from 'vite';

/** Workspace sources whose imports follow the TypeScript config. */
const SOURCE_IMPORTER = /\.[cm]?tsx?$/;

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
      if (!resolvedModule || resolvedModule.isExternalLibraryImport || resolvedModule.resolvedFileName.endsWith('.d.ts')) return null;
      return resolvedModule.resolvedFileName;
    },
  };
};
