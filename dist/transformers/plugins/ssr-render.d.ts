import { Types as CoreTypes } from 'handoff-core';
import { Plugin } from 'vite';
import Handoff from '../..';
import { TransformComponentTokensResult } from '../preview/types';
/**
 * SSR render plugin factory
 * @param componentData - Component transformation data
 * @param documentationComponents - Documentation components
 * @param handoff - Handoff instance
 * @returns Vite plugin for SSR rendering
 */
export declare function ssrRenderPlugin(componentData: TransformComponentTokensResult, documentationComponents: CoreTypes.IDocumentationObject['components'], handoff: Handoff): Plugin;
