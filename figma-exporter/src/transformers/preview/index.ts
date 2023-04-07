import Mustache from 'mustache';
import { parse } from 'node-html-parser';
import { DocumentationObject } from '../../types';
import { filterOutNull } from '../../utils';
import { getComponentTemplate } from './utils';

const getComponentTemplateByKey = async <Key extends keyof DocumentationObject['components']>(
  componentKey: Key,
  componentTokens: DocumentationObject['components'][Key][number]
) => {
  if (componentKey === 'buttons') {
    const tokens = componentTokens as DocumentationObject['components']['buttons'][number];

    if (tokens.componentType === 'design') {
      return await getComponentTemplate('button', tokens.type, tokens.state);
    }

    return await getComponentTemplate('button', tokens.size);
  }

  if (componentKey === 'selects') {
    const tokens = componentTokens as DocumentationObject['components']['selects'][number];

    if (tokens.componentType === 'design') {
      return await getComponentTemplate('select', tokens.state);
    }

    return await getComponentTemplate('select', tokens.size);
  }

  if (componentKey === 'inputs') {
    const tokens = componentTokens as DocumentationObject['components']['inputs'][number];

    if (tokens.componentType === 'design') {
      return await getComponentTemplate('input', tokens.state);
    }

    return await getComponentTemplate('input', tokens.size);
  }

  if (componentKey === 'checkboxes') {
    const tokens = componentTokens as DocumentationObject['components']['checkboxes'][number];

    if (tokens.componentType === 'design') {
      return await getComponentTemplate('checkbox', tokens.state, tokens.activity);
    }

    return await getComponentTemplate('checkbox', tokens.size);
  }

  if (componentKey === 'tooltips') {
    const tokens = componentTokens as DocumentationObject['components']['tooltips'][number];

    return await getComponentTemplate('tooltip', tokens.vertical, tokens.horizontal);
  }

  if (componentKey === 'modal') {
    return await getComponentTemplate('modal');
  }

  if (componentKey === 'alerts') {
    const tokens = componentTokens as DocumentationObject['components']['alerts'][number];

    if (tokens.componentType === 'design') {
      return await getComponentTemplate('alert', tokens.type);
    }

    return await getComponentTemplate('alert', tokens.layout);
  }

  if (componentKey === 'switches') {
    const tokens = componentTokens as DocumentationObject['components']['switches'][number];

    if (tokens.componentType === 'design') {
      return await getComponentTemplate('switch', tokens.state, tokens.activity);
    }

    return await getComponentTemplate('switch', tokens.size);
  }

  if (componentKey === 'pagination') {
    const tokens = componentTokens as DocumentationObject['components']['pagination'][number];

    if (tokens.componentType === 'design') {
      return await getComponentTemplate('pagination', tokens.state);
    }

    return await getComponentTemplate('pagination', tokens.size);
  }

  if (componentKey === 'radios') {
    const tokens = componentTokens as DocumentationObject['components']['radios'][number];

    if (tokens.componentType === 'design') {
      return await getComponentTemplate('radio', tokens.state, tokens.activity);
    }

    return await getComponentTemplate('radio', tokens.size);
  }

  return null;
};

/**
 * Transforms the component tokens into a preview and code
 */
const transformComponentTokens = async <Key extends keyof DocumentationObject['components']>(
  componentKey: Key,
  componentTokens: DocumentationObject['components'][Key][number]
) => {
  const template = await getComponentTemplateByKey(componentKey, componentTokens);

  if (!template) {
    return null;
  }

  const preview = Mustache.render(template, componentTokens);
  const bodyEl = parse(preview).querySelector('body');

  return {
    id: componentTokens.id,
    preview,
    code: bodyEl ? bodyEl.innerHTML.trim() : preview,
  };
};

/**
 * Transforms the documentation object components into a preview and code
 */
export default async function previewTransformer(documentationObject: DocumentationObject) {
  const { components } = documentationObject;
  const [buttons, selects, checkboxes, inputs, tooltips, modal, alerts, switches, pagination, radios] = await Promise.all([
    Promise.all(components.buttons.map((button) => transformComponentTokens('buttons', button))).then((buttons) =>
      buttons.filter(filterOutNull)
    ),
    Promise.all(components.selects.map((select) => transformComponentTokens('selects', select))).then((selects) =>
      selects.filter(filterOutNull)
    ),
    Promise.all(components.checkboxes.map((checkbox) => transformComponentTokens('checkboxes', checkbox))).then((selects) =>
      selects.filter(filterOutNull)
    ),
    Promise.all(components.inputs.map((input) => transformComponentTokens('inputs', input))).then((inputs) => inputs.filter(filterOutNull)),
    Promise.all(components.tooltips.map((tooltip) => transformComponentTokens('tooltips', tooltip))).then((tooltips) =>
      tooltips.filter(filterOutNull)
    ),
    Promise.all(components.modal.map((modal) => transformComponentTokens('modal', modal))).then((modal) =>
      modal.filter(filterOutNull)
    ),
    Promise.all(components.alerts.map((alert) => transformComponentTokens('alerts', alert))).then((alerts) => alerts.filter(filterOutNull)),
    Promise.all(components.switches.map((switchComponent) => transformComponentTokens('switches', switchComponent))).then((switches) =>
      switches.filter(filterOutNull)
    ),
    Promise.all(components.pagination.map((pagination) => transformComponentTokens('pagination', pagination))).then((pagination) =>
      pagination.filter(filterOutNull)
    ),
    Promise.all(components.radios.map((radio) => transformComponentTokens('radios', radio))).then((radios) => radios.filter(filterOutNull)),
  ]);

  return {
    components: {
      buttons,
      selects,
      checkboxes,
      inputs,
      tooltips,
      modal,
      alerts,
      switches,
      pagination,
      radios,
    },
  };
}
