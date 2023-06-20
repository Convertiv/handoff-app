import { Component } from '../exporters/components/extractor';
import { TokenSet } from '../exporters/components/types';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../types';
import { ValueProperty } from './types';
export declare const getTokenSetTransformer: (tokenSet: TokenSet) => ((variableType: 'css' | 'scss', component: Component, part: string, tokenSet: TokenSet, options?: ExportableTransformerOptions & ExportableSharedOptions) => Record<string, ValueProperty>) | undefined;
