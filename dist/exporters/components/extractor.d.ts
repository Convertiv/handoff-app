import * as ExportTypes from './types';
import * as FigmaTypes from '../../figma/types';
import { ComponentDefinition } from '../../types';
export default function extractComponentInstances(components: {
    node: FigmaTypes.Component;
    metadata: FigmaTypes.ComponentMetadata;
}[], definition: ComponentDefinition): ExportTypes.ComponentInstance[];
