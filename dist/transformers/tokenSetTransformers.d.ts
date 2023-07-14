import { Component } from '../exporters/components/extractor';
import { TokenSet } from '../exporters/components/types';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../types';
import { ValueProperty, TokenType } from './types';
export declare const getTokenSetTransformer: (tokenSet: TokenSet) => ((tokenType: TokenType, component: Component, part: string, tokenSet: TokenSet, options?: ExportableTransformerOptions & ExportableSharedOptions) => Record<string, ValueProperty>) | undefined;
