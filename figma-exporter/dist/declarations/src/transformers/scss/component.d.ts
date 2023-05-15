import { ValueProperty } from './types';
import { Component } from '../../exporters/components/extractor';
export declare const transformComponentsToScssTypes: (name: string, components: Component[]) => string;
export declare const transformComponentTokensToScssVariables: (tokens: Component) => Record<string, ValueProperty>;
