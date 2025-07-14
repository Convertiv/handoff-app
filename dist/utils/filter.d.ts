export type Operator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'nin';
export interface FieldFilter {
    field: string;
    op: Operator;
    value: any;
}
export type LogicalFilter = {
    and?: Filter[];
    or?: Filter[];
    not?: Filter;
};
export type Filter = LogicalFilter | FieldFilter[];
interface FilterResult {
    matches: boolean;
    order?: number;
}
/**
 * Evaluates a filter against an object
 * @param obj The object to evaluate the filter against
 * @param filter The filter to evaluate (either a logical filter or array of field filters)
 * @returns FilterResult containing match status and optional order
 */
export declare function evaluateFilter(obj: Record<string, any>, filter: Filter): FilterResult;
/**
 * Filters and sorts an array of objects based on a filter
 * @param items Array of objects to filter and sort
 * @param filter Filter to apply
 * @returns Filtered and sorted array of objects
 */
export declare function filterAndSort<T extends Record<string, any>>(items: T[], filter: Filter): T[];
export {};
