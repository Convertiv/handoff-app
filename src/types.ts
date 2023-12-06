import type { DocumentComponentsObject } from './exporters/components';
import { BlendMode } from './figma/types';
import { Effect } from './figma/types';

export interface ColorGroup {
  group: string;
  colors: ColorObject[];
}

export interface EffectObject {
  name: string;
  machineName: string;
  group: string;
  effects: EffectParametersObject[];
}

export interface ColorObject {
  name: string;
  machineName: string;
  value: string | null;
  blend: string | null;
  group: string;
  sass: string;
}

export interface TypographyObject {
  name: string;
  machine_name: string;
  group: string;
  values: any;
}

export interface EffectParametersObject {
  type: Effect['type'];
  value: string;
}

export interface RGBObject {
  r: number;
  b: number;
  g: number;
  a: number;
}

export interface PositionObject {
  x: number;
  y: number;
}

export interface StopObject {
  color: RGBObject;
  position: number | null;
}

export interface GradientObject {
  blend: BlendMode;
  handles: PositionObject[];
  stops: StopObject[];
}



export interface OffsetObject {
  x: number;
  y: number;
}

export interface AssetObject {
  path: string;
  name: string;
  icon: string;
  index: string;
  size: number;
  data: string;
  description?: string;
}

export interface DocumentationObject {
  timestamp: string;
  design: {
    color: ColorObject[];
    typography: TypographyObject[];
    effect: EffectObject[];
  };
  components: DocumentComponentsObject;
  assets: {
    icons: AssetObject[];
    logos: AssetObject[];
  };
}

export interface HookReturn {
  filename: string;
  data: string;
}

export interface PreviewObject {
  id: string;
  preview: string;
  code: string;
}

export type PreviewJson = {
  components: {
    [key in keyof DocumentComponentsObject]: PreviewObject[];
  };
};

export type Exportable = "BACKGROUND" | "BORDER" | "SPACING" | "TYPOGRAPHY" | "FILL" | "EFFECT" | "OPACITY" | "SIZE";

export type Side = "TOP" | "RIGHT" | "BOTTOM" | "LEFT"

export interface ExportableIndex {
  options: ExportableOptions,
  definitions: string[],
}

export interface ExportableDefinition {
  id: string,
  group?: string,
  options?: ExportableOptions,
  parts: ExportableParts,
}

export interface ExportableOptions {
  shared?: ExportableSharedOptions,
  exporter: ExportableExporterOptions,
  transformer: ExportableTransformerOptions,
  demo: ExportableDemoOptions,
}

export interface ExportableSharedOptions {
  defaults?: {
    [variantProperty: string]: string
  }
}

export interface ExportableExporterOptions {
  search: string,
  supportedVariantProps: { design: string[], layout: string[] },
}

export interface ExportableTransformerOptions {
  cssRootClass?: string,
  tokenNameSegments?: string[],
  replace: { [variantProperty: string]: { [source: string]: string } }
}

export interface ExportableDemoOptions {
  tabs: { [tab: string]: { [componentType: string]: ExportableDefinitionPageFilter } }
}

export interface VariantPropertyWithParams {
  name: string,
  params?: [string, string][]
}

export interface ExportablePart {
  id: string,
  tokens: { from: string, export: Exportable[] }[],
  condition?: string[][],
};

export type ExportableParts = ExportablePart[];

interface ExportableDefinitionPageFilter { [property: string]: ExportableDefinitionPageFilterValue }

type ExportableDefinitionPageFilterValue = string  | string[] | {[value: string]: {[prop: string]: string}}