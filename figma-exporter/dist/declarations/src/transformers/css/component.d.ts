import { ValueProperty } from '../types';
import { Component } from '../../exporters/components/extractor';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../types';
/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export declare const transformComponentsToCssVariables: (componentName: string, components: Component[], options?: ExportableTransformerOptions & ExportableSharedOptions) => string;
/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
export declare const transformComponentTokensToCssVariables: (component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions) => Record<string, ValueProperty>;
