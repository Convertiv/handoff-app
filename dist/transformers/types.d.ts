import { ExportableSharedOptions, ExportableTransformerOptions } from "../types";
export interface ValueProperty {
    value: string;
    property: string;
    group?: string;
}
export declare type ExportableTransformerOptionsMap = ReadonlyMap<string, ExportableTransformerOptions & ExportableSharedOptions>;
