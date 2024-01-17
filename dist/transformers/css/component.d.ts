import { ComponentInstance, FileComponentObject } from '../../exporters/components/types';
import { ComponentDefinitionOptions } from '../../types';
/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export declare const transformComponentsToCssVariables: (componentId: string, component: FileComponentObject) => string;
/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
export declare const transformComponentTokensToCssVariables: (component: ComponentInstance, options?: ComponentDefinitionOptions) => import("../types").Token[];
