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

interface CssTransformerOutput {
  components: Record<keyof DocumentationObject['components'], string>;
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

  return {
    components,
  };
}
