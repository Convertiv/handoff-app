import capitalize from 'lodash/capitalize';
import { DocumentationObject } from '../../types';
import { transformAlertComponentsToScssVariants, transformAlertComponentTokensToScssVariables } from './components/alert';
import { transformButtonComponentsToScssVariants, transformButtonComponentTokensToScssVariables } from './components/button';
import { transformCheckboxComponentsToScssVariants, transformCheckboxComponentTokensToScssVariables } from './components/checkbox';
import { transformInputComponentsToScssVariants, transformInputComponentTokensToScssVariables } from './components/input';
import { transformModalComponentsToScssVariants, transformModalComponentTokensToScssVariables } from './components/modal';
import { transformPaginationComponentsToScssVariants, transformPaginationComponentTokensToScssVariables } from './components/pagination';
import { transformRadioComponentsToScssVariants, transformRadioComponentTokensToScssVariables } from './components/radio';
import { transformSelectComponentsToScssVariants, transformSelectComponentTokensToScssVariables } from './components/select';
import { transformSwitchComponentTokensToScssVariables, transformSwitchesComponentsToScssVariants } from './components/switch';
import { transformTooltipComponentsToScssVariants, transformTooltipComponentTokensToScssVariables } from './components/tooltip';
import transformColors from './design/colors';
import transformEffects from './design/effects';
import transformTypography from './design/typography';

interface ScssVariantsTransformerOutput {
  components: Record<keyof DocumentationObject['components'], string>;
}

interface ScssTransformerOutput {
  components: Record<keyof DocumentationObject['components'], string>;
  design: Record<'colors' | 'typography' | 'effects', string>;
}

/**
 * Build a set of Component variants to use as a set of SCSS vars
 * @param documentationObject
 * @returns
 */
export function scssVariantsTransformer(documentationObject: DocumentationObject): ScssVariantsTransformerOutput {
  const components = {
    // Buttons
    buttons: transformButtonComponentsToScssVariants(documentationObject.components.buttons),
    checkboxes: transformCheckboxComponentsToScssVariants(documentationObject.components.checkboxes),
    switches: transformSwitchesComponentsToScssVariants(documentationObject.components.switches),
    selects: transformSelectComponentsToScssVariants(documentationObject.components.selects),
    inputs: transformInputComponentsToScssVariants(documentationObject.components.inputs),
    modal: transformModalComponentsToScssVariants(documentationObject.components.modal),
    pagination: transformPaginationComponentsToScssVariants(documentationObject.components.pagination),
    alerts: transformAlertComponentsToScssVariants(documentationObject.components.alerts),
    tooltips: transformTooltipComponentsToScssVariants(documentationObject.components.tooltips),
    radios: transformRadioComponentsToScssVariants(documentationObject.components.radios),
  };

  return {
    components
  };
}

/**
 * Transform all the components to scss
 * @param documentationObject
 * @returns
 */
export default function scssTransformer(documentationObject: DocumentationObject): ScssTransformerOutput {
  const components = {
    // Buttons
    buttons: documentationObject.components.buttons
      .map(
        (button) =>
          `// ${capitalize(button.componentType === 'design' ? button.type : button.size)} button${button.componentType === 'design' ? `, theme: ${capitalize(button.theme)}, state: ${capitalize(button.state)}` : ''
          }
${Object.entries(transformButtonComponentTokensToScssVariables(button))
            .map(([variable, value]) => `${variable}: ${value.value};`)
            .join('\n')}`
      )
      .join('\n\n'),

    // Selects
    selects: documentationObject.components.selects
      .map(
        (select) =>
          `// ${capitalize(select.componentType === 'design' ? '' : `${select.size} `)}select${select.componentType === 'design' ? `, theme: ${capitalize(select.theme)}, state: ${capitalize(select.state)}` : ''
          }
${Object.entries(transformSelectComponentTokensToScssVariables(select))
            .map(([variable, value]) => `${variable}: ${value.value};`)
            .join('\n')}`
      )
      .join('\n\n'),
    checkboxes: documentationObject.components.checkboxes
      .map(
        (checkbox) =>
          `// ${capitalize(checkbox.componentType === 'design' ? '' : `${checkbox.size} `)}input${checkbox.componentType === 'design' ? `, theme: ${capitalize(checkbox.theme)}, state: ${capitalize(checkbox.state)}` : ''
          }
${Object.entries(transformCheckboxComponentTokensToScssVariables(checkbox))
            .map(([variable, value]) => `${variable}: ${value.value};`)
            .join('\n')}`
      )
      .join('\n\n'),
    // Inputs
    inputs: documentationObject.components.inputs
      .map(
        (input) =>
          `// ${capitalize(input.componentType === 'design' ? '' : `${input.size} `)}input${input.componentType === 'design' ? `, theme: ${capitalize(input.theme)}, state: ${capitalize(input.state)}` : ''
          }
${Object.entries(transformInputComponentTokensToScssVariables(input))
            .map(([variable, value]) => `${variable}: ${value.value};`)
            .join('\n')}`
      )
      .join('\n\n'),

    // Tooltips
    tooltips: documentationObject.components.tooltips
      .map(
        (tooltip) =>
          `// tooltips
${Object.entries(transformTooltipComponentTokensToScssVariables(tooltip))
            .map(([variable, value]) => `${variable}: ${value.value};`)
            .join('\n')}`
      )
      .join('\n\n'),

    // Alerts
    alerts: documentationObject.components.alerts
      .map(
        (alert) =>
          `// ${capitalize(alert.componentType === 'design' ? alert.type : alert.layout)} alert
${Object.entries(transformAlertComponentTokensToScssVariables(alert))
            .map(([variable, value]) => `${variable}: ${value.value};`)
            .join('\n')}`
      )
      .join('\n\n'),

    // Modal
    modal: documentationObject.components.modal
      .map(
        (modal) =>
          `// Modal
${Object.entries(transformModalComponentTokensToScssVariables(modal))
            .map(([variable, value]) => `${variable}: ${value.value};`)
            .join('\n')}`
      )
      .join('\n\n'),

    // Switches
    switches: documentationObject.components.switches
      .map(
        (switchComponent) =>
          `// ${capitalize(switchComponent.componentType === 'design' ? '' : switchComponent.size)} switch${switchComponent.componentType === 'design'
            ? `, theme: ${capitalize(switchComponent.theme)}, state: ${capitalize(switchComponent.state)}`
            : ''
          }
${Object.entries(transformSwitchComponentTokensToScssVariables(switchComponent))
            .map(([variable, value]) => `${variable}: ${value.value};`)
            .join('\n')}`
      )
      .join('\n\n'),

    // Pagination
    pagination: documentationObject.components.pagination
      .map(
        (pagination) =>
          `// ${capitalize(pagination.componentType === 'design' ? '' : pagination.size)} pagination${pagination.componentType === 'design' ? `, theme: ${capitalize(pagination.theme)}, state: ${capitalize(pagination.state)}` : ''
          }
${Object.entries(transformPaginationComponentTokensToScssVariables(pagination))
            .map(([variable, value]) => `${variable}: ${value.value};`)
            .join('\n')}`
      )
      .join('\n\n'),
    radios: documentationObject.components.radios
      .map(
        (radio) =>
          `// ${capitalize(radio.componentType === 'design' ? '' : radio.size)} pagination${radio.componentType === 'design' ? `, theme: ${capitalize(radio.theme)}, state: ${capitalize(radio.state)}` : ''
          }
${Object.entries(transformRadioComponentTokensToScssVariables(radio))
            .map(([variable, value]) => `${variable}: ${value.value};`)
            .join('\n')}`
      )
      .join('\n\n'),
  };

  const design = {
    colors: transformColors(documentationObject.design.color),
    typography: transformTypography(documentationObject.design.typography),
    effects: transformEffects(documentationObject.design.effect),
  }

  return {
    components,
    design
  };
}
