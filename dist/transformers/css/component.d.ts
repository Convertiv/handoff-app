import { ComponentInstance, FileComponentObject } from '../../exporters/components/types';
import { IntegrationObjectComponentOptions } from '../../types/config';
import { Token } from '../types';
import Handoff from 'handoff/index';
/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export declare const transformComponentsToCssVariables: (componentId: string, component: FileComponentObject, integrationOptions?: IntegrationObjectComponentOptions, handoff?: Handoff) => string;
/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
export declare const transformComponentTokensToCssVariables: (component: ComponentInstance, options?: IntegrationObjectComponentOptions) => Token[];
export declare const tokenReferenceFormat: (token: Token, type: 'css' | 'scss' | 'sd', handoff?: Handoff) => string;
