import { ValueProperty } from './types';
import { Component } from '../../exporters/components/extractor';
/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export declare const transformComponentsToCssVariables: (components: Component[]) => string;
/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
export declare const transformComponentTokensToCssVariables: (componentName: string, tokens: Component) => Record<string, ValueProperty>;
