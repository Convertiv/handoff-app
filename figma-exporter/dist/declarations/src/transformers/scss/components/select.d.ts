import { SelectComponent, SelectComponents } from '../../../exporters/components/component_sets/select';
import { ValueProperty } from '../types';
/**
 * Transfor selects into scss variants
 * @param selects
 * @returns
 */
export declare const transformSelectComponentsToScssTypes: (selects: SelectComponents) => string;
/**
 * Transform select comonent into scss variables
 * @param tokens
 * @returns
 */
export declare const transformSelectComponentTokensToScssVariables: (tokens: SelectComponent) => Record<string, ValueProperty>;
