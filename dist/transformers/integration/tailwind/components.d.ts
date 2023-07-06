import { Component } from '../../../exporters/components/extractor';
import { ExportableSharedOptions, ExportableTransformerOptions } from '../../../types';
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export declare const transformComponentsToTailwind: (_: string, components: Component[], options?: ExportableTransformerOptions & ExportableSharedOptions) => string;
