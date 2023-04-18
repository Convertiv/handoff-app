import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
export declare type TooltipComponents = TooltipComponent[];
export interface TooltipComponentTokens {
    id: string;
    description: string;
    background: FigmaTypes.Paint[];
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    borderWeight: number;
    borderRadius: number;
    borderColor: FigmaTypes.Color;
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
            textTransform: FigmaTypes.TypeStyle['textCase'];
            color: FigmaTypes.Color;
        };
    };
}
export interface TooltipComponent extends TooltipComponentTokens {
    /**
     * Component vertical position
     *
     * @default 'top'
     */
    vertical: 'top' | 'bottom';
    /**
     * Horizontal position
     *
     * @default 'center'
     */
    horizontal: 'left' | 'center' | 'right';
}
export default function extractTooltipComponents(tooltipComponents: GetComponentSetComponentsResult): TooltipComponents;
