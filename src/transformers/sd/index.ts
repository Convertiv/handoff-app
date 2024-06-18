import { DocumentationObject } from '../../types.js';
import { TransformerOutput } from '../types.js';
import { transformComponentsToStyleDictionary } from './component.js';
import transformColors from './design/colors.js';
import transformEffects from './design/effects.js';
import transformTypography from './design/typography.js';

export default function sdTransformer(documentationObject: DocumentationObject): TransformerOutput {
  const components: Record<string, string> = {};

  for (const componentId in documentationObject.components) {
    components[componentId] = transformComponentsToStyleDictionary(componentId, documentationObject.components[componentId]);
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
