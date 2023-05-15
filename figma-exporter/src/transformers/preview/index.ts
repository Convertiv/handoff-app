import Mustache from 'mustache';
import { parse } from 'node-html-parser';
import { DocumentationObject } from '../../types';
import { filterOutNull } from '../../utils';
import { getComponentTemplate } from './utils';
import { Component } from '../../exporters/components/extractor';
import { TokenSets } from '../../exporters/components/types';

type GetComponentTemplateByKeyResult = string | null;
type TransformComponentTokensResult = { id: string, preview: string, code: string } | null;

function mergeTokenSets(list: TokenSets): {[key: string]: any} {
  const obj: {[key: string]: any} = {};
  list.forEach(item => {
    Object.entries(item).forEach(([key, value]) => {
      if (key !== 'name') {
        obj[key] = value;
      }
    });
  });
  return obj;
}

const getComponentTemplateByKey = async (componentKey: string, component: Component) : Promise<GetComponentTemplateByKeyResult> => {
  const parts = component.componentType === 'design'
    ? [
      ... component.type     ? [ component.type ]     : [],
      ... component.state    ? [ component.state ]    : [],
      ... component.activity ? [ component.activity ] : []
    ] : [
      ... component.size     ? [ component.size ]     : [],
      ... component.layout   ? [ component.layout ]   : [],
    ];

  return await getComponentTemplate(componentKey, ...parts);
};

/**
 * Transforms the component tokens into a preview and code
 */
const transformComponentTokens = async (componentKey: string, component: Component) : Promise<TransformComponentTokensResult> => {
  const template = await getComponentTemplateByKey(componentKey, component);

  if (!template) {
    return null;
  }

  const parts: Record<string, any> = {};

  if (component.parts) {
    Object.keys(component.parts).forEach((part) => {
      parts[part] = mergeTokenSets(component.parts![part]);
    })
  }

  const renderableComponent: Omit<Component, "parts"> & { parts: any } = {
    ...component,
    parts
  }

  const preview = Mustache.render(template, renderableComponent);
  const bodyEl = parse(preview).querySelector('body');

  return {
    id: component.id,
    preview,
    code: bodyEl ? bodyEl.innerHTML.trim() : preview,
  };
};

/**
 * Transforms the documentation object components into a preview and code
 */
export default async function previewTransformer(documentationObject: DocumentationObject) {
  const { components } = documentationObject;
  const componentKeys = Object.keys(components);

  const result = await Promise.all(componentKeys.map(async componentKey => {
    return [componentKey, await Promise.all(documentationObject.components[componentKey].map(component => transformComponentTokens(componentKey, component))).then((res) => res.filter(filterOutNull))] as [string, TransformComponentTokensResult[]]
  }));

  return {
    components: result.reduce((obj: {[key: string]: TransformComponentTokensResult[]}, el: [string, TransformComponentTokensResult[]]) => {
      obj[el[0]] = el[1];
      return obj;
    }, {}),
  };
}
