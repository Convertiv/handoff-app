import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
export declare type AlertComponents = AlertComponent[];
export interface AlertComponentTokens {
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
    spacing: number;
    parts: {
        close: {
            color: FigmaTypes.Paint[];
        };
        icon: {
            color: FigmaTypes.Paint[];
        };
        body: {
            spacing: number;
        };
        content: {
            spacing: number;
        };
        title: {
            fontFamily: string;
            fontSize: number;
            fontWeight: number;
            lineHeight: number;
            letterSpacing: number;
            textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
            textDecoration: FigmaTypes.TypeStyle['textDecoration'];
            textCase: FigmaTypes.TypeStyle['textCase'];
            color: FigmaTypes.Paint[];
            characters: string;
        };
        text: {
            fontFamily: string;
            fontSize: number;
            fontWeight: number;
            lineHeight: number;
            letterSpacing: number;
            textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
            textDecoration: FigmaTypes.TypeStyle['textDecoration'];
            textCase: FigmaTypes.TypeStyle['textCase'];
            color: FigmaTypes.Paint[];
            characters: string;
        };
        actions: {
            spacing: number;
            fontFamily: string;
            fontSize: number;
            fontWeight: number;
            lineHeight: number;
            letterSpacing: number;
            textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
            textDecoration: FigmaTypes.TypeStyle['textDecoration'];
            textCase: FigmaTypes.TypeStyle['textCase'];
            color: FigmaTypes.Paint[];
            characters: string;
        };
    };
}
export interface AlertDesignComponent extends AlertComponentTokens {
    componentType: 'design';
    /**
     * Component type (primary, secondary, tertiary, etc.)
     *
     * @default 'primary'
     */
    type: string;
}
export interface AlertLayoutComponent extends AlertComponentTokens {
    componentType: 'layout';
    /**
     * Component layout
     */
    layout: 'horizontal' | 'vertical';
}
export declare type AlertComponent = AlertDesignComponent | AlertLayoutComponent;
export default function extractAlertComponents(alertComponents: GetComponentSetComponentsResult): AlertComponents;
