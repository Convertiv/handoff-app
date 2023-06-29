import { Component } from "../exporters/components/extractor";
import { ExportableSharedOptions, ExportableTransformerOptions } from "../types";
/**
 * Generate a comment block at the top of each record
 * @param type
 * @param component
 * @returns
 */
export declare const formatComponentCodeBlockComment: (type: string, component: Component, format: "/**/" | "//") => string;
export declare const formatVariableName: (variableType: 'css' | 'scss', component: Component, part: string, property: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => string;
export declare const normalizeVariableToken: (token: string, val?: string, options?: ExportableTransformerOptions & ExportableSharedOptions) => string | undefined;
export declare const normalizeVariablePart: (part: string) => string;
