import { InputComponent, InputComponents } from '../../../exporters/components/component_sets/input';
import { ValueProperty } from '../types';
/**
 * Generate variant maps from input components
 * @param inputs
 * @returns
 */
export declare const transformInputComponentsToScssTypes: (inputs: InputComponents) => string;
export declare const transformInputComponentTokensToScssVariables: (tokens: InputComponent) => Record<string, ValueProperty>;
