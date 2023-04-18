import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
export declare type InputComponents = InputComponent[];
export interface InputComponentTokens {
    id: string;
    description: string;
    background: FigmaTypes.Paint[];
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    borderWeight: number;
    borderRadius: number;
    borderColor: FigmaTypes.Paint[];
    effects: FigmaTypes.Effect[];
    parts: {
        label: {
            characters: string;
            spacing: number | undefined;
            fontFamily: string;
            fontSize: number;
            fontWeight: number;
            lineHeight: number;
            letterSpacing: number;
            textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
            textDecoration: FigmaTypes.TypeStyle['textDecoration'];
            textCase: FigmaTypes.TypeStyle['textCase'];
            color: FigmaTypes.Color;
        };
        text: {
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
        };
        icon: {
            borderWeight: number;
            borderColor: FigmaTypes.Color;
        };
        additionalInfo: {
            characters: string;
            spacing: number | undefined;
            fontFamily: string;
            fontSize: number;
            fontWeight: number;
            lineHeight: number;
            letterSpacing: number;
            textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
            textDecoration: FigmaTypes.TypeStyle['textDecoration'];
            textCase: FigmaTypes.TypeStyle['textCase'];
            color: FigmaTypes.Color;
        };
    };
}
export interface InputDesignComponent extends InputComponentTokens {
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
     * @default 'Default'
     */
    state: 'default' | 'hover' | 'disabled' | 'error' | 'active' | 'complete';
}
export interface InputLayoutComponent extends InputComponentTokens {
    componentType: 'layout';
    /**
     * Component size (small, medium, large)
     */
    size: string;
}
export declare type InputComponent = InputDesignComponent | InputLayoutComponent;
/**
 * Extract input components
 * @param inputComponents
 * @returns InputComponents
 */
export default function extractInputComponents(inputComponents: GetComponentSetComponentsResult): InputComponents;
