import react from '@vitejs/plugin-react';
import { Types as CoreTypes } from 'handoff-core';
import path from 'path';
import { BuildOptions, InlineConfig, build as viteBuild } from 'vite';
import Handoff from '../../../index';
import viteBaseConfig from '../../config';
import { handlebarsPreviewsPlugin } from '../../plugins';
import { getComponentOutputPath } from '../component';
import { TransformComponentTokensResult } from '../types';

/**
 * Builds previews for components using Vite and Handlebars.
 *
 * @param data - The result of transforming component tokens.
 * @param handoff - The Handoff configuration object.
 * @param components - Optional file components object.
 * @returns A promise that resolves to the transformed component tokens result.
 * @throws Will throw an error if the Vite build process fails.
 *
 * @example
 * ```typescript
 * const result = await buildPreviews(transformedData, handoffConfig, fileComponents);
 * ```
 */
export const buildPreviews = async (
  data: TransformComponentTokensResult,
  handoff: Handoff,
  components?: CoreTypes.IDocumentationObject['components']
): Promise<TransformComponentTokensResult> => {
  if (!data.entries?.template) return data;
  let plugins = [...(viteBaseConfig.plugins || []), handlebarsPreviewsPlugin(data, components)];
  let build: BuildOptions = {
    outDir: getComponentOutputPath(handoff),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        script: 'script',
      },
    },
  };

  if (data.entries.template.includes('.html')) {
    console.log('Building HTML From HTML', data.entries);
    plugins = [...(viteBaseConfig.plugins || []), react()];
    build = {
      emptyOutDir: false,
      rollupOptions: {
        input: path.resolve(data.entries.template),
        output: {
          format: 'iife',
          dir: path.resolve(getComponentOutputPath(handoff)),
          entryFileNames: data.id + '-[hash].js',
          manualChunks: undefined,
        },
      },
    };
  }
  // Store the current NODE_ENV value before vite build
  // This is necessary because viteBuild forcibly sets NODE_ENV to 'production'
  // which can cause issues with subsequent Next.js operations that rely on
  // the original NODE_ENV value
  const oldNodeEnv = process.env.NODE_ENV;

  try {
    let viteConfig: InlineConfig = {
      ...viteBaseConfig,
      build,
      plugins,
    };

    // Allow configuration to be modified through hooks
    if (handoff?.config?.hooks?.htmlBuildConfig) {
      viteConfig = handoff.config.hooks.htmlBuildConfig(viteConfig);
    }

    await viteBuild(viteConfig);
  } catch (error) {
    console.error(`Error building component previews: ${data.entries.template}`, error);
  } finally {
    // Restore the original NODE_ENV value after vite build completes
    // This prevents interference with Next.js app building/running processes
    // that depend on the correct NODE_ENV value
    if (oldNodeEnv === 'development' || oldNodeEnv === 'production' || oldNodeEnv === 'test') {
      (process.env as any).NODE_ENV = oldNodeEnv;
    } else {
      delete (process.env as any).NODE_ENV;
    }
  }

  return data;
};

const reactHtmlTemplate = (data: TransformComponentTokensResult) => {
  return `
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./${data.id}.tsx"></script>
  </body>
</html>`;
};

export default buildPreviews;
