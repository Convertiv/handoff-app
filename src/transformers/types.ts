import { DocumentationObject, ExportableSharedOptions, ExportableTransformerOptions } from "../types";

export interface AbstractComponent {
  componentType?: string;
  /**
   * Component theme (light, dark)
   */
  theme?: string;
  /**
   * Component type (primary, secondary, tertiary, etc.)
   */
  type?: string;
  /**
   * Component state (default, hover, disabled)
   */
  state?: string;
  /**
   * Component size (lg, md, sm, xs, ...)
   */
  size?: string;
  layout?: string;
}

export interface TransformerOutput {
  components: Record<keyof DocumentationObject['components'], string>;
  design: Record<'colors' | 'typography' | 'effects', string>;
}

export interface ValueProperty {
  property: string;
  value: string;
  part: string;
  metadata: {
    propertyPath: string[]
    name: string;
    type: string;
    state: string;
    theme: string;
    layout: string;
    size: string;
    part: string;
    variant: string;
  }
}

export type ExportableTransformerOptionsMap = ReadonlyMap<string, ExportableTransformerOptions & ExportableSharedOptions>;

export type TokenType = 'css' | 'scss' | 'sd';