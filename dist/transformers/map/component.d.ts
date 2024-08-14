import { FileComponentObject } from '../../exporters/components/types';
import { IntegrationObjectComponentOptions } from 'handoff/types/config';
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export declare const transformComponentsToMap: (_: string, component: FileComponentObject, integrationOptions: IntegrationObjectComponentOptions) => Record<string, string>;
