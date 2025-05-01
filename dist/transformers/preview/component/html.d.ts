import { FileComponentsObject } from '../../../exporters/components/types';
import Handoff from '../../../index';
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
export declare const buildPreviews: (data: TransformComponentTokensResult, handoff: Handoff, components?: FileComponentsObject) => Promise<TransformComponentTokensResult>;
export default buildPreviews;
