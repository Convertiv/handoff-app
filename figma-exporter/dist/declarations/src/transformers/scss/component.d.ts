import { ValueProperty } from '../types';
import { Component } from '../../exporters/components/extractor';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../types';
export declare const transformComponentsToScssTypes: (name: string, components: Component[], options?: ExportableTransformerOptions & ExportableSharedOptions) => string;
export declare const transformComponentTokensToScssVariables: (component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions) => Record<string, ValueProperty>;
