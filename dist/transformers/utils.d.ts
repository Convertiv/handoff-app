import { Component } from "../exporters/components/extractor";
import { ExportableSharedOptions, ExportableTransformerOptions } from "../types";
import { ValueProperty, TokenType, AbstractComponent } from "./types";
export declare const getTypesFromComponents: (components: AbstractComponent[]) => string[];
export declare const getStatesFromComponents: (components: AbstractComponent[]) => string[];
export declare const getThemesFromComponents: (components: AbstractComponent[]) => string[];
export declare const getSizesFromComponents: (components: AbstractComponent[]) => string[];
/**
 * Performs the transformation of the component tokens.
 *
 * @param component
 * @param options
 * @returns
 */
export declare const transformComponentTokens: (component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions) => Record<string, ValueProperty>;
/**
 * Generates a standardized component comment block.
 *
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
 * Normalizes the token name variable (specifier) by considering if the value should be replaced
 * with some other value based replace rules defined in the transformer options of the exportable
 * or removed entirely (replaced with empty string) if the value matches the default value
 * defined in the exportable shared options.
 *
 * @param variable
 * @param value
 * @param options
 * @returns
 */
export declare const normalizeTokenNameVariableValue: (variable: string, value?: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => string | undefined;
