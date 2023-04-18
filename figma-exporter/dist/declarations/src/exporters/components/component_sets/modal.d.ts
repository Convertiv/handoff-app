import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
export declare type ModalComponents = ModalComponent[];
interface ModalPartProperties {
    background: FigmaTypes.Paint[];
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
    borderWeight: number;
    borderRadius: number;
    borderColor: FigmaTypes.Paint[];
    effects: FigmaTypes.Effect[];
}
interface ModalPartTextProperties {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
    textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
    textDecoration: FigmaTypes.TypeStyle['textDecoration'];
    textTransform: FigmaTypes.TypeStyle['textCase'];
    color: FigmaTypes.Paint[];
    characters: string;
}
declare type ModalHeaderPartProperties = ModalPartProperties & {
    title: ModalPartTextProperties;
};
declare type ModalBodyPartProperties = ModalPartProperties & {
    content: ModalPartTextProperties;
};
declare type ModalFooterPartProperties = ModalPartProperties & {
    copy: ModalPartTextProperties;
};
export interface ModalComponentTokens extends ModalPartProperties {
    id: string;
    description: string;
    parts: {
        header: ModalHeaderPartProperties;
        body: ModalBodyPartProperties;
        footer: ModalFooterPartProperties;
    };
}
export interface ModalDesignComponent extends ModalComponentTokens {
    componentType: 'design';
    type: string;
}
export interface ModalLayoutComponent extends ModalComponentTokens {
    componentType: 'layout';
    size: string;
}
export declare type ModalComponent = ModalDesignComponent | ModalLayoutComponent;
export default function extractModalComponents(modalComponents: GetComponentSetComponentsResult): ModalComponents;
export {};
