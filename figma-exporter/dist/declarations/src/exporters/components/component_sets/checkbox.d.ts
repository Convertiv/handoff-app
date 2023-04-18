import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
export declare type CheckboxComponents = CheckboxComponent[];
export interface CheckboxComponentTokens {
    id: string;
    height: number;
    description: string;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    opacity: number;
    parts: {
        check: {
            width: number;
            height: number;
            paddingLeft: number;
            color: FigmaTypes.Paint[];
            background: FigmaTypes.Paint[];
            borderWeight: number;
            borderRadius: number;
            borderColor: FigmaTypes.Paint[];
            effects: FigmaTypes.Effect[];
        };
        icon: {
            width: number;
            height: number;
        };
        label: {
            characters: string;
            fontFamily: string;
            fontSize: number;
            fontWeight: number;
            lineHeight: number;
            letterSpacing: number;
            textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
            textDecoration: FigmaTypes.TypeStyle['textDecoration'];
            textCase: FigmaTypes.TypeStyle['textCase'];
            color: FigmaTypes.Color;
            opacity: number;
        };
    };
}
export interface CheckboxLayoutComponent extends CheckboxComponentTokens {
    componentType: 'layout';
    /**
     * Component size (lg, md, sm, xs, ...)
     */
    size: string;
}
export interface CheckboxDesignComponent extends CheckboxComponentTokens {
    componentType: 'design';
    /**
     * Component theme (light, dark)
     *
     * @default 'light'
     */
    theme: 'light' | 'dark';
    /**
     * Component state (default, hover, disabled)
     *
     * @default 'default'
     */
    state: 'default' | 'hover' | 'disabled';
    /**
     * Component activity (on, off)
     *
     * @default 'light'
     */
    activity: 'on' | 'off';
}
export declare type CheckboxComponent = CheckboxDesignComponent | CheckboxLayoutComponent;
/**
 * Extract input components
 * @param inputComponents
 * @returns InputComponents
 */
export default function extractCheckboxComponents(inputComponents: GetComponentSetComponentsResult): CheckboxComponents;
