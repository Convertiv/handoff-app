import { ModalComponent, ModalComponents } from '../../../exporters/components/component_sets/modal';
import { ValueProperty } from '../types';
export declare const transformModalComponentsToScssTypes: (modals: ModalComponents) => string;
/**
 * Generate Modal SCSS vars from Modal Tokens
 * @param param0
 * @returns
 */
export declare const transformModalComponentTokensToScssVariables: ({ ...tokens }: ModalComponent) => Record<string, ValueProperty>;
