import path from 'path';
import { Logger } from '../../utils/logger';
import { generatePropertiesFromDocgen } from '../docgen';
import { SlotMetadata } from '../preview/component';
import { buildAndEvaluateModule } from './module';
import { isValidSchemaObject, loadSchemaFromExports } from './schema';

/**
 * Loads and processes schema from a separate schema file
 * @param schemaPath - Path to the schema file
 * @param handoff - Handoff instance for configuration
 * @returns Processed properties or null if failed
 */
export const loadSchemaFromFile = async (
  schemaPath: string,
  handoff: any
): Promise<{ [key: string]: SlotMetadata } | null> => {
  const ext = path.extname(schemaPath);
  
  if (ext !== '.ts' && ext !== '.tsx') {
    Logger.warn(`Schema file has unsupported extension: ${ext}`);
    return null;
  }

  try {
    const schemaMod = await buildAndEvaluateModule(schemaPath, handoff);
    
    // Get schema from exports.default (separate schema files export as default)
    const schema = loadSchemaFromExports(schemaMod.exports, handoff, 'default');

    if (isValidSchemaObject(schema)) {
      // Valid schema object - convert to properties
      if (handoff.config?.hooks?.schemaToProperties) {
        return handoff.config.hooks.schemaToProperties(schema);
      }
    } else if (schema) {
      // Schema exists but is not a valid schema object (e.g., type/interface)
      // Use react-docgen-typescript to document the schema file
      return await generatePropertiesFromDocgen(schemaPath, handoff);
    }
    
    return null;
  } catch (error) {
    Logger.warn(`Failed to load separate schema file ${schemaPath}: ${error}`);
    return null;
  }
};

/**
 * Loads and processes schema from component exports
 * @param componentExports - Component module exports
 * @param handoff - Handoff instance for configuration
 * @returns Processed properties or null if failed
 */
export const loadSchemaFromComponent = async (
  componentExports: any,
  handoff: any
): Promise<{ [key: string]: SlotMetadata } | null> => {
  // Check for exported schema in component file (exports.schema)
  const schema = loadSchemaFromExports(componentExports, handoff, 'schema');

  if (isValidSchemaObject(schema)) {
    // Valid schema object - convert to properties
    if (handoff.config?.hooks?.schemaToProperties) {
      return handoff.config.hooks.schemaToProperties(schema);
    }
  } else if (schema) {
    // Schema exists but is not a valid schema object (e.g., type/interface)
    // Use react-docgen-typescript to document the schema
    return await generatePropertiesFromDocgen(componentExports.__filename || '', handoff);
  }
  
  return null;
};
