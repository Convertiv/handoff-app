import { SlotMetadata } from '../preview/component';
/**
 * Ensures all properties have proper IDs assigned recursively
 * @param properties - The properties object to process
 * @returns The properties object with IDs assigned
 */
export declare const ensureIds: (properties: {
    [key: string]: SlotMetadata;
}) => {
    [key: string]: SlotMetadata;
};
/**
 * Converts react-docgen-typescript props to our SlotMetadata format
 * @param docgenProps - Array of props from react-docgen-typescript
 * @returns Converted properties object
 */
export declare const convertDocgenToProperties: (docgenProps: any[]) => {
    [key: string]: SlotMetadata;
};
/**
 * Validates if a schema object is valid for property conversion
 * @param schema - The schema object to validate
 * @returns True if schema is valid, false otherwise
 */
export declare const isValidSchemaObject: (schema: any) => boolean;
/**
 * Safely loads schema from module exports
 * @param moduleExports - The module exports object
 * @param handoff - Handoff instance for configuration
 * @param exportKey - The export key to look for ('default' or 'schema')
 * @returns The schema object or null if not found/invalid
 */
export declare const loadSchemaFromExports: (moduleExports: any, handoff: any, exportKey?: "default" | "schema") => any;
