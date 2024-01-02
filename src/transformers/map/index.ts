import { DocumentationObject } from '../../types';
import { TransformerOutput } from '../types';
import { transformComponentsToMap } from './component';
import transformColors from './design/colors';
import transformEffects from './design/effects';
import transformTypography from './design/typography';

export default function mapTransformer(documentationObject: DocumentationObject): TransformerOutput {
  let flatMap: Record<string, string> = {};

  const components: Record<string, string> = {};
  for (const componentId in documentationObject.components) {
    const map = transformComponentsToMap(componentId, documentationObject.components[componentId]);
    components[componentId] = JSON.stringify(map, null, 2);
    flatMap = { ...flatMap, ...map }
  }

  const colors = transformColors(documentationObject.design.color);
  const typography = transformTypography(documentationObject.design.typography);
  const effects = transformEffects(documentationObject.design.effect);

  flatMap = { ...flatMap, ...colors, ...typography, ...effects };

  return {
    components,
    design: {
      colors: JSON.stringify(colors, null, 2),
      typography: JSON.stringify(typography, null, 2),
      effects: JSON.stringify(effects, null, 2),
    },
    attachments: {
      "tokens-map": JSON.stringify(flatMap, null, 2),
    }
  };
}
