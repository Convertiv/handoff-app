"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSchemaFromExports = exports.isValidSchemaObject = exports.convertDocgenToProperties = exports.ensureIds = void 0;
const component_1 = require("../preview/component");
/**
 * Ensures all properties have proper IDs assigned recursively
 * @param properties - The properties object to process
 * @returns The properties object with IDs assigned
 */
const ensureIds = (properties) => {
    var _a;
    for (const key in properties) {
        properties[key].id = key;
        if ((_a = properties[key].items) === null || _a === void 0 ? void 0 : _a.properties) {
            (0, exports.ensureIds)(properties[key].items.properties);
        }
        if (properties[key].properties) {
            (0, exports.ensureIds)(properties[key].properties);
        }
    }
    return properties;
};
exports.ensureIds = ensureIds;
/**
 * Converts react-docgen-typescript props to our SlotMetadata format
 * @param docgenProps - Array of props from react-docgen-typescript
 * @returns Converted properties object
 */
const convertDocgenToProperties = (docgenProps) => {
    const properties = {};
    for (const prop of docgenProps) {
        const { name, type, required, description, defaultValue } = prop;
        // Convert react-docgen-typescript type to our SlotType enum
        let propType = component_1.SlotType.TEXT;
        if ((type === null || type === void 0 ? void 0 : type.name) === 'boolean') {
            propType = component_1.SlotType.BOOLEAN;
        }
        else if ((type === null || type === void 0 ? void 0 : type.name) === 'number') {
            propType = component_1.SlotType.NUMBER;
        }
        else if ((type === null || type === void 0 ? void 0 : type.name) === 'array') {
            propType = component_1.SlotType.ARRAY;
        }
        else if ((type === null || type === void 0 ? void 0 : type.name) === 'object') {
            propType = component_1.SlotType.OBJECT;
        }
        else if ((type === null || type === void 0 ? void 0 : type.name) === 'function') {
            propType = component_1.SlotType.FUNCTION;
        }
        else if ((type === null || type === void 0 ? void 0 : type.name) === 'enum') {
            propType = component_1.SlotType.ENUM;
        }
        properties[name] = {
            id: name,
            name: name,
            description: description || '',
            generic: '',
            type: propType,
            default: (defaultValue === null || defaultValue === void 0 ? void 0 : defaultValue.value) || undefined,
            rules: {
                required: required || false,
            },
        };
    }
    return properties;
};
exports.convertDocgenToProperties = convertDocgenToProperties;
/**
 * Validates if a schema object is valid for property conversion
 * @param schema - The schema object to validate
 * @returns True if schema is valid, false otherwise
 */
const isValidSchemaObject = (schema) => {
    return schema &&
        typeof schema === 'object' &&
        schema.type === 'object' &&
        schema.properties &&
        typeof schema.properties === 'object';
};
exports.isValidSchemaObject = isValidSchemaObject;
/**
 * Safely loads schema from module exports
 * @param moduleExports - The module exports object
 * @param handoff - Handoff instance for configuration
 * @param exportKey - The export key to look for ('default' or 'schema')
 * @returns The schema object or null if not found/invalid
 */
const loadSchemaFromExports = (moduleExports, handoff, exportKey = 'default') => {
    var _a, _b;
    try {
        const schema = ((_b = (_a = handoff.config) === null || _a === void 0 ? void 0 : _a.hooks) === null || _b === void 0 ? void 0 : _b.getSchemaFromExports)
            ? handoff.config.hooks.getSchemaFromExports(moduleExports)
            : moduleExports[exportKey];
        return schema;
    }
    catch (error) {
        console.warn(`Failed to load schema from exports (${exportKey}):`, error);
        return null;
    }
};
exports.loadSchemaFromExports = loadSchemaFromExports;
