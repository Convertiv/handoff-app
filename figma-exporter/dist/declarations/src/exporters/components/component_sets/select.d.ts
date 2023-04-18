import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
export declare type SelectComponents = SelectComponent[];
export interface SelectComponentTokens {
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
            spacing: number | undefined;
            fontFamily: string;
            fontSize: number;
            fontWeight: number;
            lineHeight: number;
            letterSpacing: number;
            textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
            textDecoration: FigmaTypes.TypeStyle['textDecoration'];
            textCase: FigmaTypes.TypeStyle['textCase'];
            color: FigmaTypes.Paint[];
        };
        option: {
            fontFamily: string;
            fontSize: number;
            fontWeight: number;
            lineHeight: number;
            letterSpacing: number;
            textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
            textDecoration: FigmaTypes.TypeStyle['textDecoration'];
            textCase: FigmaTypes.TypeStyle['textCase'];
            color: FigmaTypes.Paint[];
        };
        icon: {
            width: number;
            height: number;
            color: FigmaTypes.Paint[];
        };
        additionalInfo: {
            spacing: number | undefined;
            fontFamily: string;
            fontSize: number;
            fontWeight: number;
            lineHeight: number;
            letterSpacing: number;
            textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
            textDecoration: FigmaTypes.TypeStyle['textDecoration'];
            textCase: FigmaTypes.TypeStyle['textCase'];
            color: FigmaTypes.Paint[];
        };
    };
}
export interface SelectDesignComponent extends SelectComponentTokens {
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
}
export interface SelectLayoutComponent extends SelectComponentTokens {
    componentType: 'layout';
    /**
     * Component size (xl, lg, md, sm, xs)
     */
    size: string;
}
export declare type SelectComponent = SelectDesignComponent | SelectLayoutComponent;
export default function extractSelectComponents(selectComponents: GetComponentSetComponentsResult): SelectComponents;
