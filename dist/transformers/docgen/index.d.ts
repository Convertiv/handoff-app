/**
 * Generates component properties using react-docgen-typescript
 * @param entry - Path to the component/schema file
 * @param handoff - Handoff instance for configuration
 * @returns Generated properties or null if failed
 */
export declare const generatePropertiesFromDocgen: (entry: string, handoff: any) => Promise<{
    [key: string]: any;
} | null>;
