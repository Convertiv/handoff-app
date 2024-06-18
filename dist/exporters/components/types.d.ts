import * as FigmaTypes from 'handoff/figma/types.js';
import { Exportable, ComponentDefinition, Side } from "../../types.js";
export interface FileComponentObject {
    instances: ComponentInstance[];
    definitions: DocumentComponentDefinitions;
}
export interface FileComponentsObject {
    [key: string]: FileComponentObject;
}
export interface ComponentInstance {
    id: string;
    name: string;
    description?: string;
    variantProperties: [string, string][];
    parts?: {
        [key: string]: TokenSets;
    };
    definitionId: string;
}
export interface BaseTokenSet {
    name: Exportable;
}
export interface EffectTokenSet extends BaseTokenSet {
    name: 'EFFECT';
    effect: FigmaTypes.Effect[];
}
export interface BackgroundTokenSet extends BaseTokenSet {
    name: 'BACKGROUND';
    background: FigmaTypes.Paint[];
}
export interface FillTokenSet extends BaseTokenSet {
    name: 'FILL';
    color: FigmaTypes.Paint[];
}
export interface BorderTokenSet extends BaseTokenSet {
    name: 'BORDER';
    weight: number;
    radius: number;
    strokes: FigmaTypes.Paint[];
    dashes: number[];
}
export interface SpacingTokenSet extends BaseTokenSet {
    name: 'SPACING';
    padding: {
        [key in Side]: number;
    };
    spacing: number;
}
export interface TypographyTokenSet extends BaseTokenSet {
    name: 'TYPOGRAPHY';
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
    textAlignHorizontal: FigmaTypes.TypeStyle['textAlignHorizontal'];
    textDecoration: FigmaTypes.TypeStyle['textDecoration'];
    textCase: FigmaTypes.TypeStyle['textCase'];
    characters: string;
}
export interface OpacityTokenSet extends BaseTokenSet {
    name: 'OPACITY';
    opacity: number;
}
export interface SizeTokenSet extends BaseTokenSet {
    name: 'SIZE';
    width: number;
    height: number;
}
export type DocumentComponentDefinitions = {
    [id: string]: ComponentDefinition;
};
export type TokenSet = BackgroundTokenSet | FillTokenSet | BorderTokenSet | SpacingTokenSet | TypographyTokenSet | EffectTokenSet | OpacityTokenSet | SizeTokenSet;
export type TokenSets = TokenSet[];
