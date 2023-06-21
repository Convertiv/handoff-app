import { ExportableSharedOptions, ExportableTransformerOptions } from "../types";

export interface ValueProperty {
  value: string;
  property: string;
  group?: string;
}

export type ExportableTransformerOptionsMap = ReadonlyMap<string, ExportableTransformerOptions & ExportableSharedOptions>;