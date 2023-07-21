import { Component } from "../exporters/components/extractor";
import { ExportableSharedOptions, ExportableTransformerOptions, TypographyObject } from "../types";
import { TokenType, AbstractComponent } from "./types";
/**
 * Returns normalized type name
 * @param type
 * @returns
 */
export declare const getTypeName: (type: TypographyObject) => string;
/**
 * Returns a distinct list of types found within the given list of components.
 * @param components
 * @returns
 */
export declare const getTypesFromComponents: (components: AbstractComponent[]) => string[];
/**
 * Returns a distinct list of states found within the given list of components.
 * @param components
 * @returns
 */
export declare const getStatesFromComponents: (components: AbstractComponent[]) => string[];
/**
 * Returns a distinct list of themes found within the given list of components.
 * @param components
 * @returns
 */
export declare const getThemesFromComponents: (components: AbstractComponent[]) => string[];
/**
 * Returns a distinct list of sizes found within the given list of components.
 * @param components
 * @returns
 */
export declare const getSizesFromComponents: (components: AbstractComponent[]) => string[];
/**
 * Generates a standardized component comment block.
 * @param type
 * @param component
 * @returns
 */
export declare const formatComponentCodeBlockComment: (type: string, component: Component, format: "/**/" | "//") => string;
/**
 * Formats the component token name for the given token type
 * @param tokenType
 * @param component
 * @param part
 * @param property
 * @param options
 * @returns
 */
export declare const formatTokenName: (tokenType: TokenType, component: Component, part: string, property: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => string;
/**
 * Returns a reduced token name in form of a string.
 * @param component
 * @param part
 * @param property
 * @param options
 * @returns
 */
export declare const getReducedTokenName: (component: Component, part: string, property: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => string;
/**
 * Reduces the token property path to a fixed number of parts.
 * @param component
 * @param options
 * @returns
 */
export declare const getReducedTokenPropertyPath: (component: Component, part: string, property: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => string[];
/**
 * Normalizes the token name variable (specifier) by considering if the value should be replaced
 * with some other value based replace rules defined in the transformer options of the exportable
 * or removed entirely (replaced with empty string) if the value matches the default value
 * defined in the exportable shared options.
 * @param variable
 * @param value
 * @param options
 * @returns
 */
export declare const normalizeTokenNameVariableValue: (variable: string, value?: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => string;
