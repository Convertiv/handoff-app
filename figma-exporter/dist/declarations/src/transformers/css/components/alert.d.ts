import { AlertComponent, AlertComponents } from '../../../exporters/components/component_sets/alert';
import { ValueProperty } from '../types';
/**
 * Map down to a variable object
 * @param alerts
 * @returns
 */
export declare const transformAlertComponentsToCssVariables: (alerts: AlertComponents) => string;
/**
 * Generate a list of css variables
 * @param tokens
 * @returns
 */
export declare const transformAlertComponentTokensToCssVariables: (tokens: AlertComponent) => Record<string, ValueProperty>;
