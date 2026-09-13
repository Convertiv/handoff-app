import react from '@vitejs/plugin-react';
import { Types as CoreTypes } from 'handoff-core';
import { InlineConfig, PluginOption, build as viteBuild } from 'vite';
import type { RendererKind, SourceFormat } from '../../../catalog/renderers';
import Handoff from '../../../index';
import { Logger } from '../../../utils/logger';
import { csfRenderPlugin, handlebarsPreviewsPlugin, ssrRenderPlugin } from '../../plugins';
import viteBaseConfig from '../../vite-config';
import { getComponentOutputPath } from '../component';
import { TransformComponentTokensResult } from '../types';

type PreviewPlugins = (
  data: TransformComponentTokensResult,
  components: CoreTypes.IDocumentationObject['components'] | undefined,
  handoff: Handoff
) => PluginOption[];

/**
 * Exactly one entry builds an item. A source format claims it before its renderer, because a CSF
 * item is also a React item and both plugins would write their own previews. The maps are
 * exhaustive, so a new renderer fails to compile until its previews are built.
 */
const FORMAT_PLUGINS: Record<SourceFormat, PreviewPlugins> = {
  csf: (data, components, handoff) => [csfRenderPlugin(data, components, handoff)],
};

const RENDERER_PLUGINS: Record<RendererKind, PreviewPlugins> = {
  handlebars: (data, components, handoff) => [handlebarsPreviewsPlugin(data, components, handoff)],
  react: (data, components, handoff) => [react(), ssrRenderPlugin(data, components, handoff)],
};

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

  const { renderer, sourceFormat } = data;

  const previewPlugins = sourceFormat ? FORMAT_PLUGINS[sourceFormat] : RENDERER_PLUGINS[renderer];
  if (!previewPlugins) {
    Logger.error(
      `No preview support for renderer "${renderer}"${sourceFormat ? ` and source format "${sourceFormat}"` : ''}: ${data.entries.template}`
    );
    return data;
  }

  const plugins = [...(viteBaseConfig.plugins || []), ...previewPlugins(data, components, handoff)];

  // Store the current NODE_ENV value before vite build
  // This is necessary because viteBuild forcibly sets NODE_ENV to 'production'
  // which can cause issues with subsequent Next.js operations that rely on
  // the original NODE_ENV value
  const oldNodeEnv = process.env.NODE_ENV;

  try {
    let viteConfig: InlineConfig = {
      ...viteBaseConfig,
      // @ts-ignore - its easy to have mismatched types here
      plugins,
      build: {
        outDir: getComponentOutputPath(handoff),
        emptyOutDir: false,
        rollupOptions: {
          input: { script: 'script' },
        },
      },
    };

    // Allow configuration to be modified through hooks
    if (handoff?.config?.hooks?.htmlBuildConfig) {
      viteConfig = handoff.config.hooks.htmlBuildConfig(viteConfig);
    }

    await viteBuild(viteConfig);
  } catch (error) {
    Logger.error(`Error building component previews: ${data.entries.template}`, error);
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

export default buildPreviews;
