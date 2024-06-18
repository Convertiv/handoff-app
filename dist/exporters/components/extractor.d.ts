import * as ExportTypes from './types.js';
import * as FigmaTypes from '../../figma/types.js';
import { ComponentDefinition, LegacyComponentDefinition } from '../../types.js';
export default function extractComponentInstances(components: {
    node: FigmaTypes.Component;
    metadata: FigmaTypes.ComponentMetadata;
}[], definition: ComponentDefinition, legacyDefinition?: LegacyComponentDefinition): ExportTypes.ComponentInstance[];
