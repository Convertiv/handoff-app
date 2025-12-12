import { SlotMetadata } from '../preview/component';
import { HandlebarsContext } from '../types';
/**
 * Registers common Handlebars helpers
 * @param data - Component data containing properties
 * @param injectFieldWrappers - Whether to inject field wrappers for inspection
 */
export declare const registerHandlebarsHelpers: (data: {
    properties: {
        [key: string]: SlotMetadata;
    };
    id: string;
}, injectFieldWrappers: boolean) => void;
/**
 * Creates Handlebars template context
 * @param data - Component data
 * @param previewData - Preview data with values
 * @returns Handlebars context object
 */
export declare const createHandlebarsContext: (data: {
    id: string;
    properties: {
        [key: string]: SlotMetadata;
    };
    title: string;
}, previewData: {
    values?: any;
}) => HandlebarsContext;
