import { ComponentInstance, FileComponentObject } from '../../exporters/components/types';
import { IntegrationObjectComponentOptions } from '../../types/config';
export declare const transformComponentsToScssTypes: (name: string, component: FileComponentObject, options?: IntegrationObjectComponentOptions) => string;
export declare const transformComponentTokensToScssVariables: (component: ComponentInstance, options?: IntegrationObjectComponentOptions) => import("../types").Token[];
