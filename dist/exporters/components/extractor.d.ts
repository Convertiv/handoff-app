import * as ExportTypes from './types';
import { ExportableDefinition } from '../../types';
import { GetComponentSetComponentsResult } from '.';
interface ComponentBase {
    id: string;
    name: string;
    description?: string;
    parts?: {
        [key: string]: ExportTypes.TokenSets;
    };
}
export interface ComponentDesign extends ComponentBase {
    componentType: 'design';
    /**
     * Component theme (light, dark)
     */
    theme?: string;
    /**
     * Component type (primary, secondary, tertiary, etc.)
     */
    type?: string;
    /**
     * Component state (default, hover, disabled, etc.)
     */
    state?: string;
    /**
     * Component activity (on, off)
     */
    activity?: string;
}
export interface ComponentLayout extends ComponentBase {
    componentType: 'layout';
    /**
     * Component layout
     */
    layout?: string;
    /**
     * Component size (lg, md, sm, xs, ...)
     */
    size?: string;
}
export declare type Component = ComponentDesign | ComponentLayout;
export default function extractComponents(componentSetComponentsResult: GetComponentSetComponentsResult, definition: ExportableDefinition): Component[];
export {};
