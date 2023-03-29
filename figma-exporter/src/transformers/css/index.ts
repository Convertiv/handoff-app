import { ColorObject, DocumentationObject, TypographyObject } from '../../types';
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
  design: Record<'colors' | 'typography', string>;
}

function transformColors(colors: ColorObject[]): string {
  const stringBuilder: Array<string> = [];

  stringBuilder.push(`$color-groups: ( ${Array.from(new Set(colors.map(color => `"${color.group}"`))).join(', ')} );`);
  stringBuilder.push(`$color-names: ( ${colors.map(color => `"${color.group}-${color.machineName}"`).join(', ')} );`);
  stringBuilder.push(``);

  colors.forEach(color => {
    stringBuilder.push(`--color-${color.group}-${color.machineName}: ${color.hex};`);
  });

  return stringBuilder.join('\n');
}

function transformTypography(typography: TypographyObject[]): string {
  const stringBuilder: Array<string> = [];

  stringBuilder.push(`$type-sizes: ( ${typography.map(type => `"${type.machine_name}"`).join(', ')} );`);
  stringBuilder.push(``);

  typography.forEach(type => {
    stringBuilder.push([
      `--typography-${type.machine_name}-font-family: '${type.values.fontFamily}';`,
      `--typography-${type.machine_name}-font-size: ${type.values.fontSize}px;`,
      `--typography-${type.machine_name}-font-weight: ${type.values.fontWeight};`,
      `--typography-${type.machine_name}-line-height: ${(type.values.lineHeightPx / type.values.fontSize).toFixed(1)};`,
      `--typography-${type.machine_name}-letter-spacing: ${type.values.letterSpacing}px;`,
      `--typography-${type.machine_name}-paragraph-spacing: ${type.values.paragraphSpacing | 20}px;`,
    ].join('\n'));
  })
  
  return stringBuilder.join('\n');
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
  }

  return {
    components,
    design,
  };
}
