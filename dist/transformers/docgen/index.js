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
exports.generatePropertiesFromDocgen = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const react_docgen_typescript_1 = require("react-docgen-typescript");
const schema_1 = require("../utils/schema");
/**
 * Generates component properties using react-docgen-typescript
 * @param entry - Path to the component/schema file
 * @param handoff - Handoff instance for configuration
 * @returns Generated properties or null if failed
 */
const generatePropertiesFromDocgen = (entry, handoff) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Use root project's tsconfig.json
        const tsconfigPath = path_1.default.resolve(handoff.workingPath, 'tsconfig.json');
        // Check if tsconfig exists
        if (!fs_extra_1.default.existsSync(tsconfigPath)) {
            console.warn(`TypeScript config not found at ${tsconfigPath}, using default configuration`);
        }
        const parserConfig = {
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
        const parser = (0, react_docgen_typescript_1.withCustomConfig)(tsconfigPath, parserConfig);
        const docgenResults = parser.parse(entry);
        if (docgenResults.length > 0) {
            const componentDoc = docgenResults[0];
            if (componentDoc.props && Object.keys(componentDoc.props).length > 0) {
                return (0, schema_1.convertDocgenToProperties)(Object.values(componentDoc.props));
            }
        }
        return null;
    }
    catch (error) {
        console.warn(`Failed to generate docs with react-docgen-typescript for ${entry}:`, error);
        return null;
    }
});
exports.generatePropertiesFromDocgen = generatePropertiesFromDocgen;
