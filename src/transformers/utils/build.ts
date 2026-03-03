import esbuild from 'esbuild';
import path from 'path';
import Handoff from '../../index';
import { Logger } from '../../utils/logger';

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

function toForwardSlash(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Generates the entry source for a standalone client-side React component module.
 * The resulting module exports `render(container, props)` and `update(props)`
 * so the Playground can dynamically load and re-render it in an iframe.
 */
export function generateClientComponentSource(componentPath: string): string {
  return `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import Component from '${toForwardSlash(componentPath)}';

    let root = null;

    export function render(container, props) {
      root = createRoot(container);
      root.render(React.createElement(Component, props));
      return root;
    }

    export function update(props) {
      if (root) {
        root.render(React.createElement(Component, props));
      }
    }
  `;
}

/**
 * Generates the entry source for a standalone CSF component module.
 * Replicates the story rendering logic (meta.render / story.render / meta.component)
 * so the Playground can render CSF components client-side.
 */
export function generateCsfClientComponentSource(
  componentPath: string,
  storyKey: string
): string {
  return `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import * as stories from '${toForwardSlash(componentPath)}';

    const meta = stories.default || {};
    const story = stories['${storyKey}'];

    let root = null;

    function renderElement(props) {
      const storyRender = typeof story === 'function' ? story : (story && story.render);
      const renderFn = storyRender || meta.render;
      if (renderFn) {
        const result = renderFn(props);
        return React.isValidElement(result) ? result : React.createElement(meta.component, props);
      }
      if (meta.component) {
        return React.createElement(meta.component, props);
      }
      return React.createElement('pre', null, JSON.stringify(props, null, 2));
    }

    export function render(container, props) {
      root = createRoot(container);
      root.render(renderElement(props));
      return root;
    }

    export function update(props) {
      if (root) {
        root.render(renderElement(props));
      }
    }
  `;
}

/**
 * Builds a self-contained browser ESM module from the given source code.
 * React and ReactDOM are bundled into the output so the module works standalone.
 */
export async function buildClientModule(
  sourceCode: string,
  handoff: Handoff
): Promise<string> {
  const config: esbuild.BuildOptions = {
    ...DEFAULT_CLIENT_BUILD_CONFIG,
    logLevel: 'silent',
    stdin: {
      contents: sourceCode,
      resolveDir: process.cwd(),
      loader: 'tsx' as const,
    },
    plugins: [createReactResolvePlugin(handoff.workingPath, handoff.modulePath)],
  };

  const finalConfig = handoff.config?.hooks?.clientBuildConfig
    ? handoff.config.hooks.clientBuildConfig(config)
    : config;

  const result = await esbuild.build(finalConfig);

  if (result.warnings.length > 0) {
    const messages = await esbuild.formatMessages(result.warnings, { kind: 'warning', color: true });
    messages.forEach((msg) => Logger.warn(msg));
  }

  return result.outputFiles[0].text;
}
