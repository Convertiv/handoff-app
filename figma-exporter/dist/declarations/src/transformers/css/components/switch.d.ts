import { SwitchComponent, SwitchComponents } from '../../../exporters/components/component_sets/switch';
import { ValueProperty } from '../types';
/**
 * Transform switches into css variables
 * @param switches
 * @returns
 */
export declare const transformSwitchesComponentsToCssVariables: (switches: SwitchComponents) => string;
export declare const transformSwitchComponentTokensToCssVariables: (tokens: SwitchComponent) => Record<string, ValueProperty>;
