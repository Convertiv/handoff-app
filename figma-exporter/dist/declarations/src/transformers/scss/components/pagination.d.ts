import { PaginationComponent, PaginationComponents } from '../../../exporters/components/component_sets/pagination';
import { ValueProperty } from '../types';
/**
 * Generate SCSS variants from pagination component
 * @param pagination
 * @returns
 */
export declare const transformPaginationComponentsToScssTypes: (pagination: PaginationComponents) => string;
export declare const transformPaginationComponentTokensToScssVariables: (tokens: PaginationComponent) => Record<string, ValueProperty>;
