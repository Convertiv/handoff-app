import * as ExportTypes from './types';
import * as FigmaTypes from '../../figma/types';
import { ComponentDefinition, LegacyComponentDefinition } from '../../types';
export default function extractComponentInstances(components: {
    node: FigmaTypes.Component;
    metadata: FigmaTypes.ComponentMetadata;
}[], definition: ComponentDefinition, legacyDefinition?: LegacyComponentDefinition): ExportTypes.ComponentInstance[];
