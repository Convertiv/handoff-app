import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
export declare type PaginationComponents = PaginationComponent[];
export interface PaginationComponentTokens {
    id: string;
    description: string;
    background: FigmaTypes.Paint[];
    borderWeight: number;
    borderRadius: number;
    borderColor: FigmaTypes.Paint[];
    spacing: number | undefined;
    parts: {
        previous: {
            background: FigmaTypes.Paint[];
            borderWeight: number;
            borderRadius: number;
            borderColor: FigmaTypes.Paint[];
            paddingTop: number;
            paddingRight: number;
            paddingBottom: number;
            paddingLeft: number;
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
        next: {
            background: FigmaTypes.Paint[];
            borderWeight: number;
            borderRadius: number;
            borderColor: FigmaTypes.Paint[];
            paddingTop: number;
            paddingRight: number;
            paddingBottom: number;
            paddingLeft: number;
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
        item: {
            background: FigmaTypes.Paint[];
            borderWeight: number;
            borderRadius: number;
            borderColor: FigmaTypes.Paint[];
            paddingTop: number;
            paddingRight: number;
            paddingBottom: number;
            paddingLeft: number;
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
export interface PaginationDesignComponent extends PaginationComponentTokens {
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
    state: 'default' | 'hover' | 'disabled' | 'active';
}
export interface PaginationLayoutComponent extends PaginationComponentTokens {
    componentType: 'layout';
    /**
     * Component size (xl, lg, md, sm, xs)
     */
    size: string;
}
export declare type PaginationComponent = PaginationDesignComponent | PaginationLayoutComponent;
export default function extractPaginationComponents(paginationComponents: GetComponentSetComponentsResult): PaginationComponents;
