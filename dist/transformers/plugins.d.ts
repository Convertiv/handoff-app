import { Plugin } from 'vite';
import { FileComponentsObject } from '../exporters/components/types';
import { TransformComponentTokensResult } from './preview/types';
export declare function handlebarsPreviewsPlugin(data: TransformComponentTokensResult, components?: FileComponentsObject): Plugin;
