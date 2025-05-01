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

  return data;
};

export default buildPreviews;
