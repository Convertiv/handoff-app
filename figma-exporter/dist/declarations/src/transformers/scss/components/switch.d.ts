import { SwitchComponent, SwitchComponents } from '../../../exporters/components/component_sets/switch';
import { ValueProperty } from '../types';
/**
 * Transform switches into scss variants
 * @param switches
 * @returns
 */
export declare const transformSwitchesComponentsToScssTypes: (switches: SwitchComponents) => string;
export declare const transformSwitchComponentTokensToScssVariables: (tokens: SwitchComponent) => Record<string, ValueProperty>;
