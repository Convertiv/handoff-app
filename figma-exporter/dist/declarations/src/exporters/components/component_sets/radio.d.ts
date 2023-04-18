import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
export declare type RadioComponents = RadioComponent[];
export interface RadioComponentTokens {
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
            background: FigmaTypes.Paint[];
            borderWeight: number;
            borderRadius: number;
            borderColor: FigmaTypes.Paint[];
            effects: FigmaTypes.Effect[];
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
        thumb: {
            width: number;
            height: number;
            background: FigmaTypes.Paint[];
            borderWeight: number;
            borderColor: FigmaTypes.Paint[];
        };
    };
}
export interface RadioLayoutComponent extends RadioComponentTokens {
    componentType: 'layout';
    /**
     * Component size (lg, md, sm, xs, ...)
     */
    size: string;
}
export interface RadioDesignComponent extends RadioComponentTokens {
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
     * Component theme (light, dark)
     *
     * @default 'light'
     */
    activity: 'on' | 'off';
}
export declare type RadioComponent = RadioDesignComponent | RadioLayoutComponent;
/**
 * Extract input components
 * @param inputComponents
 * @returns InputComponents
 */
export default function extractRadioComponents(inputComponents: GetComponentSetComponentsResult): RadioComponents;
