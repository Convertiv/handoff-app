import { RadioComponent, RadioComponents } from '../../../exporters/components/component_sets/radio';
import { ValueProperty } from '../types';
/**
 * Transform Radio Components into CSS Variables
 * @param radios
 * @returns
 */
export declare const transformRadioComponentsToCssVariables: (radios: RadioComponents) => string;
export declare const transformRadioComponentTokensToCssVariables: (tokens: RadioComponent) => Record<string, ValueProperty>;
