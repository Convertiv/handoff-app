import { FileComponentObject } from '../../exporters/components/types';
/**
 * Transforms the component tokens into a style dictionary
 * @param alerts
 * @returns
 */
export declare const transformComponentsToMap: (_: string, component: FileComponentObject) => Record<string, string>;
