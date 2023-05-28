import { Component } from "../exporters/components/extractor";
import { ExportableTransformerOptions } from "../types";
/**
 * Generate a comment block at the top of each record
 * @param type
 * @param component
 * @returns
 */
export declare const formatComponentCodeBlockComment: (type: string, component: Component, format: "/**/" | "//") => string;
export declare const formatVariableName: (variableType: 'css' | 'scss', component: Component, part: string, property: string, options?: ExportableTransformerOptions) => string;
