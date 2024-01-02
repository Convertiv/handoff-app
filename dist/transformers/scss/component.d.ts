import { ComponentInstance, FileComponentObject } from '../../exporters/components/types';
import { ComponentDefinitionOptions } from '../../types';
export declare const transformComponentsToScssTypes: (name: string, component: FileComponentObject) => string;
export declare const transformComponentTokensToScssVariables: (component: ComponentInstance, options?: ComponentDefinitionOptions) => import("../types").Token[];
