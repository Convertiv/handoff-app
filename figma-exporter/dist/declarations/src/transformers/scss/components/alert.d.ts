import { AlertComponent, AlertComponents } from '../../../exporters/components/component_sets/alert';
import { ValueProperty } from '../types';
/**
 * Generate a list of alert variants as an scss map
 * @param alerts
 * @returns
 */
export declare const transformAlertComponentsToScssTypes: (alerts: AlertComponents) => string;
export declare const transformAlertComponentTokensToScssVariables: (tokens: AlertComponent) => Record<string, ValueProperty>;
