import { SlotMetadata } from '../preview/component';
/**
 * Loads and processes schema from a separate schema file
 * @param schemaPath - Path to the schema file
 * @param handoff - Handoff instance for configuration
 * @returns Processed properties or null if failed
 */
export declare const loadSchemaFromFile: (schemaPath: string, handoff: any) => Promise<{
    [key: string]: SlotMetadata;
} | null>;
/**
 * Loads and processes schema from component exports
 * @param componentExports - Component module exports
 * @param handoff - Handoff instance for configuration
 * @returns Processed properties or null if failed
 */
export declare const loadSchemaFromComponent: (componentExports: any, handoff: any) => Promise<{
    [key: string]: SlotMetadata;
} | null>;
