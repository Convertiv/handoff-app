import { DocumentationObject } from '../../types';
import { transformAlertComponentsToCssVariables } from './components/alert';
import { transformButtonComponentsToCssVariables } from './components/button';
import { transformCheckboxComponentsToCssVariables } from './components/checkbox';
import { transformInputComponentsToCssVariables } from './components/input';
import { transformModalComponentsToCssVariables } from './components/modal';
import { transformPaginationComponentsToCssVariables } from './components/pagination';
import { transformRadioComponentsToCssVariables } from './components/radio';
import { transformSelectComponentsToCssVariables } from './components/select';
import { transformSwitchesComponentsToCssVariables } from './components/switch';
import { transformTooltipComponentsToCssVariables } from './components/tooltip';
import transformColors from './design/colors';
import transformEffects from './design/effects';
import transformTypography from './design/typography';

interface CssTransformerOutput {
  components: Record<keyof DocumentationObject['components'], string>;
  design: Record<'colors' | 'typography' | 'effects', string>;
}

export default function cssTransformer(documentationObject: DocumentationObject): CssTransformerOutput {
  const components = {
    // Buttons
    buttons: transformButtonComponentsToCssVariables(documentationObject.components.buttons),
    checkboxes: transformCheckboxComponentsToCssVariables(documentationObject.components.checkboxes),
    switches: transformSwitchesComponentsToCssVariables(documentationObject.components.switches),
    selects: transformSelectComponentsToCssVariables(documentationObject.components.selects),
    inputs: transformInputComponentsToCssVariables(documentationObject.components.inputs),
    modal: transformModalComponentsToCssVariables(documentationObject.components.modal),
    pagination: transformPaginationComponentsToCssVariables(documentationObject.components.pagination),
    alerts: transformAlertComponentsToCssVariables(documentationObject.components.alerts),
    tooltips: transformTooltipComponentsToCssVariables(documentationObject.components.tooltips),
    radios: transformRadioComponentsToCssVariables(documentationObject.components.radios),
  };

  const design = {
    colors: transformColors(documentationObject.design.color),
    typography: transformTypography(documentationObject.design.typography),
    effects: transformEffects(documentationObject.design.effect),
  }

  return {
    components,
    design,
  };
}
