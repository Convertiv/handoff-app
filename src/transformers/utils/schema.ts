import { Logger } from '../../utils/logger';
import { SlotMetadata, SlotType } from '../preview/component';

/**
 * Ensures all properties have proper IDs assigned recursively
 * @param properties - The properties object to process
 * @returns The properties object with IDs assigned
 */
export const ensureIds = (properties: { [key: string]: SlotMetadata }): { [key: string]: SlotMetadata } => {
  for (const key in properties) {
    properties[key].id = key;
    if (properties[key].items?.properties) {
      ensureIds(properties[key].items.properties);
    }
    if (properties[key].properties) {
      ensureIds(properties[key].properties);
    }
  }
  return properties;
};

/**
 * Converts react-docgen-typescript props to our SlotMetadata format
 * @param docgenProps - Array of props from react-docgen-typescript
 * @returns Converted properties object
 */
export const convertDocgenToProperties = (docgenProps: any[]): { [key: string]: SlotMetadata } => {
  const properties: { [key: string]: SlotMetadata } = {};
  
  for (const prop of docgenProps) {
    const { name, type, required, description, defaultValue } = prop;
    
    // Convert react-docgen-typescript type to our SlotType enum
    let propType = SlotType.TEXT;
    if (type?.name === 'boolean') {
      propType = SlotType.BOOLEAN;
    } else if (type?.name === 'number') {
      propType = SlotType.NUMBER;
    } else if (type?.name === 'array') {
      propType = SlotType.ARRAY;
    } else if (type?.name === 'object') {
      propType = SlotType.OBJECT;
    } else if (type?.name === 'function') {
      propType = SlotType.FUNCTION;
    } else if (type?.name === 'enum') {
      propType = SlotType.ENUM;
    }
    
    properties[name] = {
      id: name,
      name: name,
      description: description || '',
      generic: '',
      type: propType,
      default: defaultValue?.value || undefined,
      rules: {
        required: required || false,
      },
    };
  }
  
  return properties;
};

/**
 * Validates if a schema object is valid for property conversion
 * @param schema - The schema object to validate
 * @returns True if schema is valid, false otherwise
 */
export const isValidSchemaObject = (schema: any): boolean => {
  return schema && 
         typeof schema === 'object' && 
         schema.type === 'object' && 
         schema.properties && 
         typeof schema.properties === 'object';
};

/**
 * Safely loads schema from module exports
 * @param moduleExports - The module exports object
 * @param handoff - Handoff instance for configuration
 * @param exportKey - The export key to look for ('default' or 'schema')
 * @returns The schema object or null if not found/invalid
 */
export const loadSchemaFromExports = (
  moduleExports: any, 
  handoff: any, 
  exportKey: 'default' | 'schema' = 'default'
): any => {
  try {
    const schema = handoff.config?.hooks?.getSchemaFromExports
      ? handoff.config.hooks.getSchemaFromExports(moduleExports)
      : moduleExports[exportKey];
    
    return schema;
  } catch (error) {
    Logger.warn(`Failed to load schema from exports (${exportKey}): ${error}`);
    return null;
  }
};
