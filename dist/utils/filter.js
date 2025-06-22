"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterAndSort = exports.evaluateFilter = void 0;
/**
 * Evaluates a filter against an object
 * @param obj The object to evaluate the filter against
 * @param filter The filter to evaluate (either a logical filter or array of field filters)
 * @returns FilterResult containing match status and optional order
 */
function evaluateFilter(obj, filter) {
    var _a, _b, _c;
    // Handle array of field filters (implicit AND)
    if (Array.isArray(filter)) {
        const results = filter.map(f => evaluateFieldFilter(obj, f));
        // If any filter doesn't match, return false
        if (!results.every(r => r.matches)) {
            return { matches: false };
        }
        // If any filter has an order, use the first one (since we're using AND)
        const order = (_a = results.find(r => r.order !== undefined)) === null || _a === void 0 ? void 0 : _a.order;
        return { matches: true, order };
    }
    // Handle logical filter
    if ('and' in filter) {
        const results = filter.and.map(f => evaluateFilter(obj, f));
        if (!results.every(r => r.matches)) {
            return { matches: false };
        }
        const order = (_b = results.find(r => r.order !== undefined)) === null || _b === void 0 ? void 0 : _b.order;
        return { matches: true, order };
    }
    if ('or' in filter) {
        const results = filter.or.map(f => evaluateFilter(obj, f));
        if (!results.some(r => r.matches)) {
            return { matches: false };
        }
        // For OR, we use the first matching order
        const order = (_c = results.find(r => r.matches && r.order !== undefined)) === null || _c === void 0 ? void 0 : _c.order;
        return { matches: true, order };
    }
    if ('not' in filter) {
        const result = evaluateFilter(obj, filter.not);
        return { matches: !result.matches };
    }
    return { matches: false };
}
exports.evaluateFilter = evaluateFilter;
/**
 * Evaluates a single field filter against an object
 * @param obj The object to evaluate the filter against
 * @param filter The field filter to evaluate
 * @returns FilterResult containing match status and optional order
 */
function evaluateFieldFilter(obj, filter) {
    const { field, op, value } = filter;
    const actual = obj[field];
    switch (op) {
        case 'eq': return { matches: actual === value };
        case 'neq': return { matches: actual !== value };
        case 'gt': return { matches: actual > value };
        case 'gte': return { matches: actual >= value };
        case 'lt': return { matches: actual < value };
        case 'lte': return { matches: actual <= value };
        case 'contains':
            if (typeof actual === 'string')
                return { matches: actual.includes(value) };
            if (Array.isArray(actual))
                return { matches: actual.includes(value) };
            return { matches: false };
        case 'in':
            if (!Array.isArray(value))
                return { matches: false };
            const index = value.indexOf(actual);
            return { matches: index !== -1, order: index };
        case 'nin': return { matches: Array.isArray(value) && !value.includes(actual) };
        default: return { matches: false };
    }
}
/**
 * Filters and sorts an array of objects based on a filter
 * @param items Array of objects to filter and sort
 * @param filter Filter to apply
 * @returns Filtered and sorted array of objects
 */
function filterAndSort(items, filter) {
    const results = items.map(item => ({
        item,
        result: evaluateFilter(item, filter)
    }));
    return results
        .filter(({ result }) => result.matches)
        .sort((a, b) => {
        // If both have orders, sort by order
        if (a.result.order !== undefined && b.result.order !== undefined) {
            return a.result.order - b.result.order;
        }
        // If only one has order, prioritize it
        if (a.result.order !== undefined)
            return -1;
        if (b.result.order !== undefined)
            return 1;
        // If neither has order, maintain original order
        return 0;
    })
        .map(({ item }) => item);
}
exports.filterAndSort = filterAndSort;
