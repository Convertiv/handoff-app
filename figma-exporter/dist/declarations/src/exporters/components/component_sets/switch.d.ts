import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
export declare type SwitchComponents = SwitchComponent[];
export interface SwitchComponentTokens {
    id: string;
    description: string;
    spacing: number;
    width: number;
    height: number;
    background: FigmaTypes.Paint[];
    borderWeight: number;
    borderRadius: number;
    borderColor: FigmaTypes.Paint[];
    opacity: number;
    effects: FigmaTypes.Effect[];
    parts: {
        label: {
            fontFamily: string;
            fontSize: number;
            fontWeight: number;
            lineHeight: number;
            letterSpacing: number;
            textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
            textDecoration: FigmaTypes.TypeStyle['textDecoration'];
            textCase: FigmaTypes.TypeStyle['textCase'];
            color: FigmaTypes.Paint[];
            opacity: number;
        };
        thumb: {
            background: FigmaTypes.Paint[];
            borderWeight: number;
            borderColor: FigmaTypes.Paint[];
            width: number;
            height: number;
        };
    };
}
export interface SwitchDesignComponent extends SwitchComponentTokens {
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
    state: 'default' | 'hover' | 'disabled' | 'error';
    /**
     * Component activity (on, off)
     *
     * @default 'light'
     */
    activity: 'on' | 'off';
}
export interface SwitchLayoutComponent extends SwitchComponentTokens {
    componentType: 'layout';
    /**
     * Component size (xl, lg, md, sm, xs)
     */
    size: string;
}
export declare type SwitchComponent = SwitchDesignComponent | SwitchLayoutComponent;
export default function extractSwitchComponents(switchComponents: GetComponentSetComponentsResult): SwitchComponents;
