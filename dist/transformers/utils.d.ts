import { ComponentInstance } from '../exporters/components/types';
import { ComponentDefinitionOptions, TypographyObject } from "../types";
import { TokenType } from "./types";
/**
 * Returns normalized type name
 * @param type
 * @returns
 */
export declare const getTypeName: (type: TypographyObject) => string;
/**
 * Generates a standardized component comment block.
 * @param type
 * @param component
 * @returns
 */
export declare const formatComponentCodeBlockComment: (component: ComponentInstance, format: "/**/" | "//") => string;
/**
 * Formats the component token name for the given token type
 * @param tokenType
 * @param component
 * @param part
 * @param property
 * @param options
 * @returns
 */
export declare const formatTokenName: (tokenType: TokenType, component: ComponentInstance, part: string, property: string, options?: ComponentDefinitionOptions) => string;
/**
 * Returns the token name segments
 * @param component
 * @param options
 * @returns
 */
export declare const getTokenNameSegments: (component: ComponentInstance, part: string, property: string, options?: ComponentDefinitionOptions) => string[];
/**
 * Normalizes the token name variable (specifier) by considering if the value should be replaced
 * with some other value based replace rules defined in the transformer options of the component
 * or removed entirely (replaced with empty string) if the value matches the default value
 * defined in the component shared options (assuming keepDefaults is set to false).
 * @param variable
 * @param value
 * @param options
 * @returns
 */
export declare const normalizeTokenNamePartValue: (variable: string, value?: string, options?: ComponentDefinitionOptions, keepDefaults?: boolean) => string;
