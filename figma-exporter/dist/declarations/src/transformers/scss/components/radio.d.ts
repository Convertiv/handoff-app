import { RadioComponent, RadioComponents } from '../../../exporters/components/component_sets/radio';
import { ValueProperty } from '../types';
/**
 * Build a list of SCSS variants from radio components
 * @param radios
 * @returns
 */
export declare const transformRadioComponentsToScssTypes: (radios: RadioComponents) => string;
/**
 * Build SCSS tokens from radio
 * @param tokens
 * @returns
 */
export declare const transformRadioComponentTokensToScssVariables: (tokens: RadioComponent) => Record<string, ValueProperty>;
