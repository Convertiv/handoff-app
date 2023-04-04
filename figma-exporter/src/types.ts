import type { DocumentComponentsObject } from './exporters/components';
import { BlendMode, PaintType } from './figma/types';
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
  group: string;
  type: PaintType;
  hex: string | null;
  rgb: RGBObject | null;
  sass: string;
  layers: ColorLayer[];
  machineName: string;
}

export type ColorLayer = RGBObject | GradientObject;

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
  position: number;
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
