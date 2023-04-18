import { PaginationComponent, PaginationComponents } from '../../../exporters/components/component_sets/pagination';
import { ValueProperty } from '../types';
/**
 * Transform Pagination components into CSS vars
 * @param pagination
 * @returns
 */
export declare const transformPaginationComponentsToCssVariables: (pagination: PaginationComponents) => string;
export declare const transformPaginationComponentTokensToCssVariables: (tokens: PaginationComponent) => Record<string, ValueProperty>;
