import { DocumentationObject } from '../../types';
import { ExportableTransformerOptionsMap, TransformerOutput } from '../types';
import { transformComponentsToStyleDictionary } from './component';
import transformColors from './design/colors';
import transformEffects from './design/effects';
import transformTypography from './design/typography';

export default function sdTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): TransformerOutput {
  const components: Record<string, string> = {};

  for (const componentName in documentationObject.components) {
    components[componentName] = transformComponentsToStyleDictionary(componentName, documentationObject.components[componentName], options?.get(componentName));
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
