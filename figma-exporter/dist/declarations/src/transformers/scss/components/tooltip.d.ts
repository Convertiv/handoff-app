import { TooltipComponents, TooltipComponentTokens } from '../../../exporters/components/component_sets/tooltip';
import { ValueProperty } from '../types';
/**
 * Transform tooltips into scss variants
 * @param tooltips
 * @returns
 */
export declare const transformTooltipComponentsToScssTypes: (tooltips: TooltipComponents) => string;
export declare const transformTooltipComponentTokensToScssVariables: ({ ...tokens }: TooltipComponentTokens) => Record<string, ValueProperty>;
