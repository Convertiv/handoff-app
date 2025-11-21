"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSchemaFromComponent = exports.loadSchemaFromFile = void 0;
const path_1 = __importDefault(require("path"));
const logger_1 = require("../../utils/logger");
const docgen_1 = require("../docgen");
const module_1 = require("./module");
const schema_1 = require("./schema");
/**
 * Loads and processes schema from a separate schema file
 * @param schemaPath - Path to the schema file
 * @param handoff - Handoff instance for configuration
 * @returns Processed properties or null if failed
 */
const loadSchemaFromFile = (schemaPath, handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const ext = path_1.default.extname(schemaPath);
    if (ext !== '.ts' && ext !== '.tsx') {
        logger_1.Logger.warn(`Unsupported schema file extension: ${ext}`);
        return null;
    }
    try {
        const schemaMod = yield (0, module_1.buildAndEvaluateModule)(schemaPath, handoff);
        // Get schema from exports.default (separate schema files export as default)
        const schema = (0, schema_1.loadSchemaFromExports)(schemaMod.exports, handoff, 'default');
        if ((0, schema_1.isValidSchemaObject)(schema)) {
            // Valid schema object - convert to properties
            if ((_b = (_a = handoff.config) === null || _a === void 0 ? void 0 : _a.hooks) === null || _b === void 0 ? void 0 : _b.schemaToProperties) {
                return handoff.config.hooks.schemaToProperties(schema);
            }
        }
        else if (schema) {
            // Schema exists but is not a valid schema object (e.g., type/interface)
            // Use react-docgen-typescript to document the schema file
            return yield (0, docgen_1.generatePropertiesFromDocgen)(schemaPath, handoff);
        }
        return null;
    }
    catch (error) {
        logger_1.Logger.warn(`Failed to load schema file "${schemaPath}": ${error}`);
        return null;
    }
});
exports.loadSchemaFromFile = loadSchemaFromFile;
/**
 * Loads and processes schema from component exports
 * @param componentExports - Component module exports
 * @param handoff - Handoff instance for configuration
 * @returns Processed properties or null if failed
 */
const loadSchemaFromComponent = (componentExports, handoff) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Check for exported schema in component file (exports.schema)
    const schema = (0, schema_1.loadSchemaFromExports)(componentExports, handoff, 'schema');
    if ((0, schema_1.isValidSchemaObject)(schema)) {
        // Valid schema object - convert to properties
        if ((_b = (_a = handoff.config) === null || _a === void 0 ? void 0 : _a.hooks) === null || _b === void 0 ? void 0 : _b.schemaToProperties) {
            return handoff.config.hooks.schemaToProperties(schema);
        }
    }
    else if (schema) {
        // Schema exists but is not a valid schema object (e.g., type/interface)
        // Use react-docgen-typescript to document the schema
        return yield (0, docgen_1.generatePropertiesFromDocgen)(componentExports.__filename || '', handoff);
    }
    return null;
});
exports.loadSchemaFromComponent = loadSchemaFromComponent;
