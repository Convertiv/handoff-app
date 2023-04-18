import { CheckboxComponent, CheckboxComponents } from '../../../exporters/components/component_sets/checkbox';
import { ValueProperty } from '../types';
/**
 * Transform checkbox tokens into CSS variables
 * @param checkboxes
 * @returns
 */
export declare const transformCheckboxComponentsToCssVariables: (checkboxes: CheckboxComponents) => string;
export declare const transformCheckboxComponentTokensToCssVariables: (tokens: CheckboxComponent) => Record<string, ValueProperty>;
