import * as ExportTypes from './types';
import * as FigmaTypes from '../../figma/types';
import { ComponentDefinition, LegacyComponentDefinition } from '../../types';
import Handoff from '../../index';
export default function extractComponentInstances(components: {
    node: FigmaTypes.Component;
    metadata: FigmaTypes.ComponentMetadata;
}[], definition: ComponentDefinition, handoff: Handoff, legacyDefinition?: LegacyComponentDefinition): ExportTypes.ComponentInstance[];
