import { ComponentInstance } from '../exporters/components/types.js';
import { ComponentDefinitionOptions } from '../types.js';
import { Token, TokenType } from './types.js';
/**
 * Performs the transformation of the component tokens.
 * @param component
 * @param options
 * @returns
 */
export declare const transform: (tokenType: TokenType, component: ComponentInstance, options?: ComponentDefinitionOptions) => Token[];
