import { InputComponent, InputComponents } from '../../../exporters/components/component_sets/input';
import { ValueProperty } from '../types';
/**
 * Generate css variable list from input components
 * @param inputs
 * @returns
 */
export declare const transformInputComponentsToCssVariables: (inputs: InputComponents) => string;
export declare const transformInputComponentTokensToCssVariables: (tokens: InputComponent) => Record<string, ValueProperty>;
