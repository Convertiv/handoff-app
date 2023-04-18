import { CheckboxComponent, CheckboxComponents } from '../../../exporters/components/component_sets/checkbox';
import { ValueProperty } from '../types';
/**
 * Generate variant maps fro checkbox components
 * @param checkboxes
 * @returns
 */
export declare const transformCheckboxComponentsToScssTypes: (checkboxes: CheckboxComponents) => string;
export declare const transformCheckboxComponentTokensToScssVariables: (tokens: CheckboxComponent) => Record<string, ValueProperty>;
