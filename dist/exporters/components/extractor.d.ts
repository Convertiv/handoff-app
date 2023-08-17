import * as ExportTypes from './types';
import { ExportableDefinition } from '../../types';
import { GetComponentSetComponentsResult } from '.';
interface BaseComponent {
    id: string;
    name: string;
    description?: string;
    type: 'design' | 'layout';
    parts?: {
        [key: string]: ExportTypes.TokenSets;
    };
    theme?: string;
}
export interface Component extends BaseComponent {
    variantProperties: [string, string][];
}
export default function extractComponents(componentSetComponentsResult: GetComponentSetComponentsResult, definition: ExportableDefinition): Component[];
export {};
