import { ComponentInstance, FileComponentObject } from '../../exporters/components/types';
import { IntegrationObjectComponentOptions } from 'handoff/types/config';
/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export declare const transformComponentsToCssVariables: (componentId: string, component: FileComponentObject, integrationOptions?: IntegrationObjectComponentOptions) => string;
/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
export declare const transformComponentTokensToCssVariables: (component: ComponentInstance, options?: IntegrationObjectComponentOptions) => import("../types").Token[];
