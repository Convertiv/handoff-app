import type { DocumentComponentsObject } from './exporters/components';

export interface ColorGroup {
  group: string;
  colors: ColorObject[];
}

export interface EffectObject {
  name: string;
  group: string;
  effects: EffectParametersObject[];
}

export interface ColorObject {
  name: string;
  group: string;
  type: string;
  hex: string;
  rgb: RGBObject;
  sass: string;
}

export interface TypographyObject {
  name: string;
  machine_name: string;
  group: string;
  values: any;
}

export interface EffectParametersObject {
  type: 'DROP_SHADOW';
  visible: boolean;
  color: RGBObject;
  offset: OffsetObject;
  radius: number;
}

export interface RGBObject {
  r: number;
  b: number;
  g: number;
  a: number;
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
  };
  components: DocumentComponentsObject;
  assets: {
    icons: AssetObject[];
    logos: AssetObject[];
  };
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
