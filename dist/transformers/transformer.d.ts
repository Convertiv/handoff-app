import { ComponentInstance } from '../exporters/components/types';
import { ComponentDefinitionOptions } from '../types';
import { Token, TokenType } from './types';
/**
 * Performs the transformation of the component tokens.
 * @param component
 * @param options
 * @returns
 */
export declare const transform: (tokenType: TokenType, component: ComponentInstance, options?: ComponentDefinitionOptions) => Token[];
