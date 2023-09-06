import { DocumentationObject } from '../../types';
import { ExportableTransformerOptionsMap, TransformerOutput } from '../types';
import { transformComponentsToCssVariables } from './component';
import transformColors from './design/colors';
import transformEffects from './design/effects';
import transformTypography from './design/typography';

export default function cssTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): TransformerOutput {
  const components: Record<string, string> = {};

  for (const componentId in documentationObject.components) {
    components[componentId] = transformComponentsToCssVariables(componentId, documentationObject.components[componentId], options?.get(componentId));
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
