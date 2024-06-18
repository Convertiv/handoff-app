import { DocumentationObject } from '../../types.js';
import { TransformerOutput } from '../types.js';
import { transformComponentsToMap } from './component.js';
import transformColors from './design/colors.js';
import transformEffects from './design/effects.js';
import transformTypography from './design/typography.js';

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
