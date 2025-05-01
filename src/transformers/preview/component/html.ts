import { InlineConfig, build as viteBuild } from 'vite';
import { FileComponentsObject } from '../../../exporters/components/types';
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
  components?: FileComponentsObject
): Promise<TransformComponentTokensResult> => {
  if (!data.entries?.template) return data;

  // Store the current NODE_ENV value before vite build
  // This is necessary because viteBuild forcibly sets NODE_ENV to 'production'
  // which can cause issues with subsequent Next.js operations that rely on
  // the original NODE_ENV value
  const oldNodeEnv = process.env.NODE_ENV;

  try {
    const viteConfig: InlineConfig = {
      ...viteBaseConfig,
      build: {
        outDir: getComponentOutputPath(handoff),
        emptyOutDir: false,
        rollupOptions: {
          input: {
            'virtual-entry': 'virtual-entry',
          },
        },
      },
      plugins: [...(viteBaseConfig.plugins || []), handlebarsPreviewsPlugin(data, components)],
    };

    await viteBuild(viteConfig);
  } catch (error) {
    console.error('Error building component previews:', error);
  } finally {
    // Restore the original NODE_ENV value after vite build completes
    // This prevents interference with Next.js app building/running processes
    // that depend on the correct NODE_ENV value
    (process.env as any).NODE_ENV = oldNodeEnv;
  }

  return data;
};

export default buildPreviews;
