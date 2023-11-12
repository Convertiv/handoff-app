import { DocumentationObject } from '../../types';
import { ExportableTransformerOptionsMap, TransformerOutput } from '../types';
import { transformComponentsToMap } from './component';
import transformColors from './design/colors';
import transformEffects from './design/effects';
import transformTypography from './design/typography';

export default function mapTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap): TransformerOutput {
  const components: Record<string, string> = {};

  for (const componentId in documentationObject.components) {
    components[componentId] = transformComponentsToMap(componentId, documentationObject.components[componentId], options?.get(componentId));
  }

  // Create a single file containing all components with their respective tokens
  components['_tokens-map'] = JSON.stringify(Object.values(components).reduce((res, val) => {
    return { ...res, ...JSON.parse(val) };
  }, {}), null, 2);

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
