import { ComponentInstance } from '../exporters/components/types';
import { Token, TokenType } from './types';
import { IntegrationObjectComponentOptions } from 'handoff/types/config';
/**
 * Performs the transformation of the component tokens.
 * @param component
 * @param options
 * @returns
 */
export declare const transform: (tokenType: TokenType, component: ComponentInstance, options?: IntegrationObjectComponentOptions) => Token[];
