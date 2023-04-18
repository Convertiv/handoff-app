import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
export declare type ButtonComponents = ButtonComponent[];
export interface ButtonComponentTokens {
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
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
    textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
    textDecoration: FigmaTypes.TypeStyle['textDecoration'];
    textCase: FigmaTypes.TypeStyle['textCase'];
    color: FigmaTypes.Paint[];
    effects: FigmaTypes.Effect[];
    opacity: number;
    /**
     * Contents of the text node
     */
    characters: string;
}
export interface ButtonDesignComponent extends ButtonComponentTokens {
    componentType: 'design';
    /**
     * Component theme (light, dark)
     *
     * @default 'light'
     */
    theme: 'light' | 'dark';
    /**
     * Component type (primary, secondary, tertiary, etc.)
     *
     * @default 'primary'
     */
    type: string;
    /**
     * Component state (default, hover, disabled)
     *
     * @default 'default'
     */
    state: 'default' | 'hover' | 'disabled';
}
export interface ButtonLayoutComponent extends ButtonComponentTokens {
    componentType: 'layout';
    /**
     * Component size (lg, md, sm, xs, ...)
     */
    size: string;
}
export declare type ButtonComponent = ButtonDesignComponent | ButtonLayoutComponent;
/**
 * Fetch all button compnents from the button component object and
 * transform into ButtonComponents
 * @param buttonComponents
 * @returns ButtonComponents
 */
export default function extractButtonComponents(buttonComponents: GetComponentSetComponentsResult): ButtonComponents;
