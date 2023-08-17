import { DocumentationObject, ExportableSharedOptions, ExportableTransformerOptions } from "../types";

export type ExportableTransformerOptionsMap = ReadonlyMap<string, ExportableTransformerOptions & ExportableSharedOptions>;
export type FoundationType = 'colors' | 'typography' | 'effects';
export type TokenType = 'css' | 'scss' | 'sd';
export type TokenDict = { [property: string]: string | [value: string, isSupportedCssProperty: boolean] }

export interface TransformerOutput {
  components: Record<keyof DocumentationObject['components'], string>;
  design: Record<FoundationType, string>;
}

export interface Token {
  property: string;
  value: string;
  part: string;
  metadata: {
    propertyPath: string[],
    isSupportedCssProperty: boolean,
  }
}