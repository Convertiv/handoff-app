import { Component } from "../exporters/components/extractor";
/**
 * Generate a comment block at the top of each record
 * @param type
 * @param component
 * @returns
 */
export declare const componentCodeBlockComment: (type: string, component: Component, format: "/**/" | "//") => string;
