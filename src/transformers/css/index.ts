import { DocumentationObject } from '../../types.js';
import { ExportableTransformerOptionsMap } from '../types.js';
import { transformComponentsToCssVariables } from './component.js';
import transformColors from './design/colors.js';
import transformEffects from './design/effects.js';
import transformTypography from './design/typography.js';

/**
 * The output of the CSS transformer
 */
export interface CssTransformerOutput {
  components: Record<keyof DocumentationObject['components'], string>;
  design: Record<'colors' | 'typography' | 'effects', string>;
}

export default function cssTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): CssTransformerOutput {
  const components: Record<string, string> = {};

  for (const componentName in documentationObject.components) {
    components[componentName] = transformComponentsToCssVariables(componentName, documentationObject.components[componentName], options?.get(componentName));
  }

  const design = {
    colors: transformColors(documentationObject.design.color),
    typography: transformTypography(documentationObject.design.typography),
    effects: transformEffects(documentationObject.design.effect),
  };

  return {
    components,
    design,
  };
}
