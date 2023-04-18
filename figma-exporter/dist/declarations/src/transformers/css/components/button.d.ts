import { ButtonComponent, ButtonComponents } from '../../../exporters/components/component_sets/button';
import { ValueProperty } from '../types';
/**
 * Render css variables from button code
 * @param buttons
 * @returns
 */
export declare const transformButtonComponentsToCssVariables: (buttons: ButtonComponents) => string;
/**
 * Transform Buton components into Css vars
 * @param tokens
 * @returns
 */
export declare const transformButtonComponentTokensToCssVariables: (tokens: ButtonComponent) => Record<string, ValueProperty>;
