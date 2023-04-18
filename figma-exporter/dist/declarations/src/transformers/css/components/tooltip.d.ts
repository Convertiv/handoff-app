import { TooltipComponents, TooltipComponentTokens } from '../../../exporters/components/component_sets/tooltip';
import { ValueProperty } from '../types';
/**
 * Build a css variable map for
 * @param tooltips
 * @returns
 */
export declare const transformTooltipComponentsToCssVariables: (tooltips: TooltipComponents) => string;
export declare const transformTooltipComponentTokensToCssVariables: ({ ...tokens }: TooltipComponentTokens) => Record<string, ValueProperty>;
