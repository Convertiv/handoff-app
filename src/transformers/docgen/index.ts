import fs from 'fs-extra';
import path from 'path';
import { withCustomConfig } from 'react-docgen-typescript';
import { Logger } from '../../utils/logger';
import { DocgenParserConfig, DocgenResult } from '../types';
import { convertDocgenToProperties } from '../utils/schema';

/**
 * Generates component properties using react-docgen-typescript
 * @param entry - Path to the component/schema file
 * @param handoff - Handoff instance for configuration
 * @returns Generated properties or null if failed
 */
export const generatePropertiesFromDocgen = async (
  entry: string, 
  handoff: any
): Promise<{ [key: string]: any } | null> => {
  try {
    // Use root project's tsconfig.json
    const tsconfigPath = path.resolve(handoff.workingPath, 'tsconfig.json');
    
    // Check if tsconfig exists
    if (!fs.existsSync(tsconfigPath)) {
      Logger.warn(`TypeScript config not found at ${tsconfigPath}, using default configuration`);
    }
    
    const parserConfig: DocgenParserConfig = {
      savePropValueAsString: true,
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => {
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules');
        }
        return true;
      },
    };
    
    const parser = withCustomConfig(tsconfigPath, parserConfig);
    const docgenResults: DocgenResult[] = parser.parse(entry);
    
    if (docgenResults.length > 0) {
      const componentDoc = docgenResults[0];
      if (componentDoc.props && Object.keys(componentDoc.props).length > 0) {
        return convertDocgenToProperties(Object.values(componentDoc.props));
      }
    }
    
    return null;
  } catch (error) {
    Logger.warn(`Failed to generate docs with react-docgen-typescript for ${entry}: ${error}`);
    return null;
  }
};
