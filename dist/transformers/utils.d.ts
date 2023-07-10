import { Component } from '../exporters/components/extractor';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../types';
import { TokenType, AbstractComponent } from './types';
export declare const getTypesFromComponents: (components: AbstractComponent[]) => string[];
export declare const getStatesFromComponents: (components: AbstractComponent[]) => string[];
export declare const getThemesFromComponents: (components: AbstractComponent[]) => string[];
export declare const getSizesFromComponents: (components: AbstractComponent[]) => string[];
/**
 * Generates a standardized component comment block.
 *
 * @param type
 * @param component
 * @returns
 */
export declare const formatComponentCodeBlockComment: (type: string, component: Component, format: '/**/' | '//') => string;
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
export declare const getReducedTokenName: (component: Component, part: string, property: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => string;
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
export declare const getTokenMetadata: (component: Component, part: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => {
    name: string;
    type: "design" | "layout";
    variant: string;
    state: string;
    theme: string;
    layout: string;
    size: string;
    activity: string;
    part: string;
};
/**
 * Reduces the number of the token name parts to just 3 items.
 *
 * @param component
 * @param options
 * @returns
 */
export declare const getReducedTokenPropertyPath: (component: Component, part: string, property: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => string[];
