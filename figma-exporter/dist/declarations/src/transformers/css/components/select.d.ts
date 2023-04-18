import { SelectComponent, SelectComponents } from '../../../exporters/components/component_sets/select';
import { ValueProperty } from '../types';
/**
 * Transform Select component to css vars
 * @param selects
 * @returns
 */
export declare const transformSelectComponentsToCssVariables: (selects: SelectComponents) => string;
/**
 * Transform Select Components into CSS variables
 * @param tokens
 * @returns
 */
export declare const transformSelectComponentTokensToCssVariables: (tokens: SelectComponent) => Record<string, ValueProperty>;
