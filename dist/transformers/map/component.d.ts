import { FileComponentObject } from '../../exporters/components/types';
import { IntegrationObjectComponentOptions } from '../../types/config';
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export declare const transformComponentsToMap: (_: string, component: FileComponentObject, integrationOptions: IntegrationObjectComponentOptions) => Record<string, string>;
export declare const transformComponentsToVariantsMap: (component: FileComponentObject, options?: IntegrationObjectComponentOptions) => {
    [variantProp: string]: string[];
};
