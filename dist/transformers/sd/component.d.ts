import { FileComponentObject } from '../../exporters/components/types';
import { IntegrationObjectComponentOptions } from '../../types/config';
import Handoff from 'handoff/index';
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export declare const transformComponentsToStyleDictionary: (_: string, component: FileComponentObject, handoff: Handoff, integrationOptions?: IntegrationObjectComponentOptions) => string;
