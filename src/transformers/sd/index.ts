import Handoff from 'handoff/index';
import { DocumentationObject } from '../../types';
import { IntegrationObject } from '../../types/config';
import { TransformerOutput } from '../types';
import { transformComponentsToStyleDictionary } from './component';
import transformColors from './design/colors';
import transformEffects from './design/effects';
import transformTypography from './design/typography';

export default function sdTransformer(documentationObject: DocumentationObject, handoff: Handoff, integrationObject?: IntegrationObject): TransformerOutput {
  const components: Record<string, string> = {};

  for (const componentId in documentationObject.components) {
    components[componentId] = transformComponentsToStyleDictionary(
      componentId,
      documentationObject.components[componentId],
      handoff,
      integrationObject?.options[componentId] ?? integrationObject?.options['*']
    );
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
