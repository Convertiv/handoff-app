import type { FileComponentsObject } from './exporters/components/types';
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
  components: FileComponentsObject;
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
    [key in keyof FileComponentsObject]: PreviewObject[];
  };
};

export interface ComponentDefinition {
  id: string,
  name: string,
  group?: string,
  parts: ComponentPart[],
  options?: ComponentDefinitionOptions,
}

export interface ComponentPart {
  id: string,
  tokens: { from: string, export: Exportable[] }[],
  condition?: string[][],
};

export interface ComponentDefinitionOptions {
  shared?: {
    defaults?: {
      [variantProperty: string]: string;
    };
  };
  exporter?: {
    variantProperties: string[];
    sharedComponentVariants?: { componentId: string; sharedVariantProperty?: string; distinctiveVariantProperties?: string[] }[];
  };
  transformer?: {
    cssRootClass?: string;
    tokenNameSegments?: string[];
    replace: { [variantProperty: string]: { [source: string]: string } };
  };
  demo?: ComponentDocumentationOptions;
}

export interface ComponentDocumentationOptions {
  views?: {
    [view: string]: {
      condition?: {
        [property: string]: ComponentViewFilterValue;
      },
      sort?: string[]
      title?: string,
    }
  }
}

export type Exportable = "BACKGROUND" | "BORDER" | "SPACING" | "TYPOGRAPHY" | "FILL" | "EFFECT" | "OPACITY" | "SIZE";
export type Side = "TOP" | "RIGHT" | "BOTTOM" | "LEFT"
type ComponentViewFilterValue = string  | string[] | {[value: string]: {[prop: string]: string}}

/**
 * @deprecated Will be removed before 1.0.0 release.
 */
export interface LegacyComponentDefinition {
  id: string;
  group?: string;
  options?: LegacyComponentDefinitionOptions;
  parts: ComponentPart[];
}

/**
 * @deprecated Will be removed before 1.0.0 release.
 */
export interface LegacyComponentDefinitionOptions {
  shared?: {
    defaults?: {
        [variantProperty: string]: string;
    };
  };
  exporter?: {
    search: string;
    supportedVariantProps: {
        design: string[];
        layout: string[];
    };
  };
  transformer?: {
    cssRootClass?: string;
    tokenNameSegments?: string[];
    replace: {
        [variantProperty: string]: {
            [source: string]: string;
        };
    };
  };
  demo?: {
    tabs?: {
        [tab: string]: {
            [componentType: string]: {
              [property: string]: ComponentViewFilterValue
            };
        };
    };
  };
}