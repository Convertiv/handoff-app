import { ModalComponent, ModalComponents } from '../../../exporters/components/component_sets/modal';
import { ValueProperty } from '../types';
/**
 * Transform Modal components into CSS Variables
 * @param modals
 * @returns
 */
export declare const transformModalComponentsToCssVariables: (modals: ModalComponents) => string;
export declare const transformModalComponentTokensToCssVariables: ({ ...tokens }: ModalComponent) => Record<string, ValueProperty>;
