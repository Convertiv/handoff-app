import { ComponentInstance, FileComponentObject } from '../../exporters/components/types.js';
import { ComponentDefinitionOptions } from '../../types.js';
export declare const transformComponentsToScssTypes: (name: string, component: FileComponentObject) => string;
export declare const transformComponentTokensToScssVariables: (component: ComponentInstance, options?: ComponentDefinitionOptions) => import("../types.js").Token[];
