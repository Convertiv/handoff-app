import * as ExportTypes from './types';
import { ExportableDefinition } from '../../types';
import { GetComponentSetComponentsResult } from '.';
export interface Component {
    id: string;
    name: string;
    description?: string;
    type: 'design' | 'layout';
    variantProperties: [string, string][];
    parts?: {
        [key: string]: ExportTypes.TokenSets;
    };
}
export default function extractComponents(componentSetComponentsResult: GetComponentSetComponentsResult, definition: ExportableDefinition): Component[];
