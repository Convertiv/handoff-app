import { Types as CoreTypes } from 'handoff-core';
import { Plugin } from 'vite';
import Handoff from '..';
import { TransformComponentTokensResult } from './preview/types';
export declare function handlebarsPreviewsPlugin(data: TransformComponentTokensResult, components: CoreTypes.IDocumentationObject['components'], handoff: Handoff): Plugin;
export declare function ssrRenderPlugin(data: TransformComponentTokensResult, components: CoreTypes.IDocumentationObject['components'], handoff?: Handoff): Plugin;
