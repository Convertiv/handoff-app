import { ButtonComponent, ButtonComponents } from '../../../exporters/components/component_sets/button';
import { ValueProperty } from '../types';
/**
 * Transform a button to an SCSS var
 * @param buttons
 * @returns
 */
export declare const transformButtonComponentsToScssTypes: (buttons: ButtonComponents, config?: any) => string;
/**
 * Transform button components into scss vars
 * @param tokens
 * @returns
 */
export declare const transformButtonComponentTokensToScssVariables: (tokens: ButtonComponent) => Record<string, ValueProperty>;
