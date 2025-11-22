import { Types as CoreTypes } from 'handoff-core';
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
export declare const buildPreviews: (data: TransformComponentTokensResult, handoff: Handoff, components?: CoreTypes.IDocumentationObject["components"]) => Promise<TransformComponentTokensResult>;
export declare const getPreviewUrls: (data: TransformComponentTokensResult) => Promise<{
    id: string;
    type?: import("../types").ComponentType;
    image?: string;
    group?: string;
    categories?: string[];
    figma?: string;
    figmaComponentId?: string;
    tags?: string[];
    should_do?: string[];
    should_not_do?: string[];
    format: string;
    code: string;
    html?: string;
    preview: string;
    js?: string;
    css?: string;
    sass?: string;
    sharedStyles?: string;
    title?: string;
    description?: string;
    previews?: {
        [key: string]: import("../types").OptionalPreviewRender;
    };
    properties?: {
        [key: string]: import("../component").SlotMetadata;
    };
    variant?: Record<string, string>;
    entries?: {
        js?: string;
        scss?: string;
        template?: string;
        schema?: string;
    };
    options?: {
        preview?: {
            groupBy?: string;
        };
    };
    validations?: Record<string, import("../../../types").ValidationResult>;
    page?: import("../types").ComponentPageDefinition;
}>;
export default buildPreviews;
