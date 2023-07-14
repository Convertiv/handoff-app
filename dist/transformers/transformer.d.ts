import { Component } from '../exporters/components/extractor';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../types';
import { Token, TokenType } from './types';
/**
 * Performs the transformation of the component tokens.
 * @param component
 * @param options
 * @returns
 */
export declare const transform: (tokenType: TokenType, component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions) => Record<string, Token>;
