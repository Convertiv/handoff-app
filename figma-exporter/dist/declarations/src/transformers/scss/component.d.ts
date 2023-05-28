import { ValueProperty } from '../types';
import { Component } from '../../exporters/components/extractor';
import { ExportableTransformerOptions } from '../../types';
export declare const transformComponentsToScssTypes: (name: string, components: Component[], options?: ExportableTransformerOptions) => string;
export declare const transformComponentTokensToScssVariables: (component: Component, options?: ExportableTransformerOptions) => Record<string, ValueProperty>;
