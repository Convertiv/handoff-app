import * as ExportTypes from './types';
import * as FigmaTypes from '../../figma/types';
import { ComponentDefinition, LegacyComponentDefinition } from '../../types';
import Handoff from '../../index';
/**
 * Given a list of components, a component definition, and a handoff object,
 * this function will extract the component instances
 * @param components
 * @param definition
 * @param handoff
 * @param legacyDefinition
 * @returns ComponentInstance[]
 */
export default function extractComponentInstances(components: {
    node: FigmaTypes.Component;
    metadata: FigmaTypes.ComponentMetadata;
}[], definition: ComponentDefinition, handoff: Handoff, legacyDefinition?: LegacyComponentDefinition): ExportTypes.ComponentInstance[];
