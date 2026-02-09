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
 * Strips nullable/optional union parts from a type string at the TOP LEVEL only.
 * Only splits on | that are at depth 0 (not inside brackets).
 * e.g., "string | null" -> "string"
 * e.g., "{ foo: string } | undefined" -> "{ foo: string }"
 * e.g., "{ width?: number | undefined }" -> "{ width?: number | undefined }" (unchanged - | is nested)
 * @param typeName - The type string to clean
 * @returns The cleaned type string
 */
const stripNullableUnion = (typeName: string): string => {
  if (!typeName) return typeName;
  
  const trimmed = typeName.trim();
  
  // Split by | only at depth 0
  const parts: string[] = [];
  let currentPart = '';
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  let angleDepth = 0;
  
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    
    // Track depth
    if (char === '{') braceDepth++;
    else if (char === '}') braceDepth--;
    else if (char === '[') bracketDepth++;
    else if (char === ']') bracketDepth--;
    else if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;
    else if (char === '<') angleDepth++;
    else if (char === '>') angleDepth--;
    
    // Only split on | at depth 0
    const isAtDepthZero = braceDepth === 0 && bracketDepth === 0 && parenDepth === 0 && angleDepth === 0;
    
    if (char === '|' && isAtDepthZero) {
      if (currentPart.trim()) {
        parts.push(currentPart.trim());
      }
      currentPart = '';
    } else {
      currentPart += char;
    }
  }
  
  // Don't forget the last part
  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }
  
  // Filter out null, undefined, never, void
  const nonNullParts = parts.filter(p => 
    p !== 'null' && 
    p !== 'undefined' && 
    p !== 'never' &&
    p !== 'void'
  );
  
  // Return the first non-null part, or original if all parts were null-like
  return nonNullParts.length > 0 ? nonNullParts[0] : typeName;
};

/**
 * Maps a type string to a SlotType enum value
 * @param typeName - The type name string (e.g., 'string', 'number', 'boolean')
 * @returns The corresponding SlotType
 */
const mapTypeNameToSlotType = (typeName: string): SlotType => {
  const normalizedType = typeName?.trim().toLowerCase();
  
  switch (normalizedType) {
    case 'boolean':
      return SlotType.BOOLEAN;
    case 'number':
      return SlotType.NUMBER;
    case 'string':
      return SlotType.TEXT;
    case 'array':
      return SlotType.ARRAY;
    case 'object':
      return SlotType.OBJECT;
    case 'function':
    case '() => void':
    case '(...args: any[]) => any':
      return SlotType.FUNCTION;
    case 'enum':
      return SlotType.ENUM;
    case 'any':
      return SlotType.ANY;
    default:
      // Check for function patterns
      if (normalizedType?.includes('=>')) {
        return SlotType.FUNCTION;
      }
      return SlotType.TEXT;
  }
};

/**
 * Checks if a type string represents an array type
 * @param typeName - The type name to check
 * @returns True if the type is an array
 */
const isArrayType = (typeName: string): boolean => {
  if (!typeName) return false;
  const trimmed = typeName.trim();
  // Match patterns like: Type[], Array<Type>, or inline object arrays like { ... }[]
  return trimmed.endsWith('[]') || trimmed.startsWith('Array<');
};

/**
 * Checks if a type string represents an inline object type
 * @param typeName - The type name to check
 * @returns True if the type is an inline object definition
 */
const isInlineObjectType = (typeName: string): boolean => {
  if (!typeName) return false;
  const trimmed = typeName.trim();
  // Match patterns like { prop: type; prop2: type2; }
  return trimmed.startsWith('{') && trimmed.includes(':');
};

/**
 * Extracts the inner type from an array type string
 * @param typeName - The array type string (e.g., 'string[]', '{ prop: type }[]', 'Array<string>')
 * @returns The inner type string
 */
const extractArrayInnerType = (typeName: string): string => {
  const trimmed = typeName.trim();
  
  // Handle Type[] syntax
  if (trimmed.endsWith('[]')) {
    return trimmed.slice(0, -2).trim();
  }
  
  // Handle Array<Type> syntax
  if (trimmed.startsWith('Array<') && trimmed.endsWith('>')) {
    return trimmed.slice(6, -1).trim();
  }
  
  return trimmed;
};

/**
 * Parses an inline object type string into SlotMetadata properties
 * Handles types like: 
 *   { icon: string; iconSprite: string; title: string; text: string; }
 *   { icon: string, iconSprite: string }  (comma-separated)
 *   { logo: { src: string } quote: string }  (space-separated after nested objects)
 * @param objectTypeStr - The object type string
 * @returns Parsed properties object
 */
const parseInlineObjectType = (objectTypeStr: string): { [key: string]: SlotMetadata } => {
  const properties: { [key: string]: SlotMetadata } = {};
  
  // Remove outer braces and trim
  let content = objectTypeStr.trim();
  if (content.startsWith('{')) {
    content = content.slice(1);
  }
  if (content.endsWith('}')) {
    content = content.slice(0, -1);
  }
  content = content.trim();
  
  if (!content) return properties;
  
  // Strategy: Find property boundaries by looking for patterns where a new property starts
  // A new property starts with: identifier followed by optional ? followed by :
  // But we need to be at depth 0 to recognize this as a new property
  
  const propDefinitions: string[] = [];
  let currentProp = '';
  let braceDepth = 0;
  let bracketDepth = 0;
  let parenDepth = 0;
  let angleDepth = 0;
  
  // Helper to check if we're at depth 0
  const isAtDepthZero = () => braceDepth === 0 && bracketDepth === 0 && parenDepth === 0 && angleDepth === 0;
  
  // Helper to check if current position looks like start of a new property
  // Pattern: identifier (possibly with ?) followed by :
  const looksLikePropertyStart = (str: string, startIdx: number): boolean => {
    // Look for pattern: word boundary + identifier + optional ? + :
    // We need at least a letter/underscore followed by optional more chars, optional ?, then :
    let j = startIdx;
    
    // Skip any leading whitespace
    while (j < str.length && /\s/.test(str[j])) j++;
    
    // Must start with letter or underscore
    if (j >= str.length || !/[a-zA-Z_$]/.test(str[j])) return false;
    
    // Consume identifier chars
    while (j < str.length && /[a-zA-Z0-9_$]/.test(str[j])) j++;
    
    // Optional ?
    if (j < str.length && str[j] === '?') j++;
    
    // Must be followed by :
    if (j < str.length && str[j] === ':') return true;
    
    return false;
  };
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    // Track depth for all bracket types
    if (char === '{') braceDepth++;
    else if (char === '}') braceDepth--;
    else if (char === '[') bracketDepth++;
    else if (char === ']') bracketDepth--;
    else if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;
    else if (char === '<') angleDepth++;
    else if (char === '>') angleDepth--;
    
    // Check for property boundary delimiters at depth 0
    if (isAtDepthZero()) {
      // Semicolon is a clear delimiter
      if (char === ';') {
        if (currentProp.trim()) {
          propDefinitions.push(currentProp.trim());
        }
        currentProp = '';
        continue;
      }
      
      // Comma can also be a delimiter (some type formats)
      if (char === ',') {
        if (currentProp.trim()) {
          propDefinitions.push(currentProp.trim());
        }
        currentProp = '';
        continue;
      }
      
      // After a closing brace at depth 0 (just became 0), check if next chars look like a new property
      // This handles cases like: { logo: { src: string } quote: string }
      if (char === '}' && i + 1 < content.length) {
        // Look ahead to see if this looks like a new property starting
        if (looksLikePropertyStart(content, i + 1)) {
          currentProp += char; // Include the closing brace
          if (currentProp.trim()) {
            propDefinitions.push(currentProp.trim());
          }
          currentProp = '';
          continue;
        }
      }
      
      // After a closing bracket at depth 0, check similarly
      if (char === ']' && i + 1 < content.length) {
        if (looksLikePropertyStart(content, i + 1)) {
          currentProp += char;
          if (currentProp.trim()) {
            propDefinitions.push(currentProp.trim());
          }
          currentProp = '';
          continue;
        }
      }
    }
    
    currentProp += char;
  }
  
  // Don't forget the last property
  if (currentProp.trim()) {
    propDefinitions.push(currentProp.trim());
  }
  
  // Parse each property definition
  for (const propDef of propDefinitions) {
    // Find the colon that separates name from type (first colon at depth 0)
    let colonIndex = -1;
    let depth = 0;
    
    for (let i = 0; i < propDef.length; i++) {
      const char = propDef[i];
      if (char === '{' || char === '[' || char === '(' || char === '<') depth++;
      else if (char === '}' || char === ']' || char === ')' || char === '>') depth--;
      else if (char === ':' && depth === 0) {
        colonIndex = i;
        break;
      }
    }
    
    if (colonIndex === -1) continue;
    
    let propName = propDef.slice(0, colonIndex).trim();
    const propTypeStr = propDef.slice(colonIndex + 1).trim();
    
    // Handle optional properties (name?)
    const isOptional = propName.endsWith('?');
    if (isOptional) {
      propName = propName.slice(0, -1).trim();
    }
    
    if (!propName) continue;
    
    // Determine the property type and nested structure
    const propMetadata = parseTypeToSlotMetadata(propName, propTypeStr, !isOptional);
    properties[propName] = propMetadata;
  }
  
  return properties;
};

/**
 * Parses a type string into a SlotMetadata object
 * Handles arrays, objects, nested structures, and union types recursively
 * @param name - The property name
 * @param typeStr - The type string
 * @param required - Whether the property is required
 * @param description - Optional description
 * @returns SlotMetadata object
 */
const parseTypeToSlotMetadata = (
  name: string, 
  typeStr: string, 
  required: boolean = false,
  description: string = ''
): SlotMetadata => {
  // Clean up the type string and strip nullable unions
  let trimmedType = typeStr?.trim() || 'any';
  trimmedType = stripNullableUnion(trimmedType);
  
  // Check if it's an array type
  if (isArrayType(trimmedType)) {
    const innerType = extractArrayInnerType(trimmedType);
    
    // Check if inner type is also an array (nested arrays like string[][])
    if (isArrayType(innerType)) {
      // Recursively parse the inner array type to get its structure
      const nestedArrayMeta = parseTypeToSlotMetadata('item', innerType, false);
      return {
        id: name,
        name: name,
        description: description,
        generic: trimmedType,
        type: SlotType.ARRAY,
        items: {
          type: nestedArrayMeta.type,
          properties: nestedArrayMeta.items?.properties,
        },
        rules: {
          required: required,
        },
      };
    }
    
    // Determine the array item type
    let itemType = mapTypeNameToSlotType(innerType);
    let itemProperties: { [key: string]: SlotMetadata } | undefined;
    
    // If inner type is an inline object, parse its properties recursively
    if (isInlineObjectType(innerType)) {
      itemType = SlotType.OBJECT;
      itemProperties = parseInlineObjectType(innerType);
      
      // Ensure all nested properties are fully parsed
      for (const key in itemProperties) {
        const prop = itemProperties[key];
        // If the property is an object with properties, ensure they're recursively parsed
        if (prop.type === SlotType.OBJECT && prop.properties) {
          for (const nestedKey in prop.properties) {
            prop.properties[nestedKey] = ensureNestedParsing(prop.properties[nestedKey]);
          }
        }
        // If the property is an array with items, ensure they're recursively parsed
        if (prop.type === SlotType.ARRAY && prop.items?.properties) {
          for (const nestedKey in prop.items.properties) {
            prop.items.properties[nestedKey] = ensureNestedParsing(prop.items.properties[nestedKey]);
          }
        }
      }
    }
    
    return {
      id: name,
      name: name,
      description: description,
      generic: trimmedType,
      type: SlotType.ARRAY,
      items: {
        type: itemType,
        properties: itemProperties,
      },
      rules: {
        required: required,
      },
    };
  }
  
  // Check if it's an inline object type
  if (isInlineObjectType(trimmedType)) {
    const objectProperties = parseInlineObjectType(trimmedType);
    
    // Ensure all nested properties are fully parsed
    for (const key in objectProperties) {
      const prop = objectProperties[key];
      // If the property is an object with properties, ensure they're recursively parsed
      if (prop.type === SlotType.OBJECT && prop.properties) {
        for (const nestedKey in prop.properties) {
          prop.properties[nestedKey] = ensureNestedParsing(prop.properties[nestedKey]);
        }
      }
      // If the property is an array with items, ensure they're recursively parsed
      if (prop.type === SlotType.ARRAY && prop.items?.properties) {
        for (const nestedKey in prop.items.properties) {
          prop.items.properties[nestedKey] = ensureNestedParsing(prop.items.properties[nestedKey]);
        }
      }
    }
    
    return {
      id: name,
      name: name,
      description: description,
      generic: trimmedType,
      type: SlotType.OBJECT,
      properties: objectProperties,
      rules: {
        required: required,
      },
    };
  }
  
  // Simple type
  return {
    id: name,
    name: name,
    description: description,
    generic: '',
    type: mapTypeNameToSlotType(trimmedType),
    rules: {
      required: required,
    },
  };
};

/**
 * Ensures a SlotMetadata object has all nested structures properly parsed
 * @param metadata - The SlotMetadata to verify
 * @returns The verified/enhanced SlotMetadata
 */
const ensureNestedParsing = (metadata: SlotMetadata): SlotMetadata => {
  // If it has a generic type that looks like an object or array but wasn't fully parsed
  if (metadata.generic) {
    // Check if the generic indicates an inline object that wasn't parsed
    if (isInlineObjectType(metadata.generic) && !metadata.properties) {
      const parsed = parseTypeToSlotMetadata(metadata.name, metadata.generic, metadata.rules?.required || false, metadata.description);
      return { ...metadata, ...parsed };
    }
    // Check if the generic indicates an array that wasn't fully parsed
    if (isArrayType(metadata.generic) && metadata.type !== SlotType.ARRAY) {
      const parsed = parseTypeToSlotMetadata(metadata.name, metadata.generic, metadata.rules?.required || false, metadata.description);
      return { ...metadata, ...parsed };
    }
  }
  
  // Recursively check nested properties
  if (metadata.properties) {
    for (const key in metadata.properties) {
      metadata.properties[key] = ensureNestedParsing(metadata.properties[key]);
    }
  }
  
  // Recursively check array item properties
  if (metadata.items?.properties) {
    for (const key in metadata.items.properties) {
      metadata.items.properties[key] = ensureNestedParsing(metadata.items.properties[key]);
    }
  }
  
  return metadata;
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
    const typeName = type?.name || 'any';
    
    // Parse the type into SlotMetadata (handles arrays, objects, and simple types)
    let propMetadata = parseTypeToSlotMetadata(name, typeName, required || false, description || '');
    
    // Ensure all nested structures are properly parsed
    propMetadata = ensureNestedParsing(propMetadata);
    
    // Set the default value if provided
    if (defaultValue?.value !== undefined) {
      propMetadata.default = defaultValue.value;
    }
    
    properties[name] = propMetadata;
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
