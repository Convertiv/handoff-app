import Mustache from 'mustache';
import { parse } from 'node-html-parser';
import { DocumentationObject } from '../../types';
import { filterOutNull } from '../../utils/index';
import { getComponentTemplate } from './utils';
import { Component } from '../../exporters/components/extractor';
import { TokenSets } from '../../exporters/components/types';
import { TransformComponentTokensResult, TransformedPreviewComponents } from './types';

type GetComponentTemplateByComponentIdResult = string | null;

function mergeTokenSets(tokenSetList: TokenSets): { [key: string]: any } {
  const obj: { [key: string]: any } = {};

  tokenSetList.forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (key !== 'name') {
        obj[key] = value;
      }
    });
  });

  return obj;
}

const getComponentTemplateByComponentId = async (componentId: string, component: Component): Promise<GetComponentTemplateByComponentIdResult> => {
  const parts = component.componentType === 'design'
    ? [
      ...(component.type ? [component.type] : []),
      ...(component.state ? [component.state] : []),
      ...(component.activity ? [component.activity] : []),
    ]
    : [...(component.size ? [component.size] : []), ...(component.layout ? [component.layout] : [])];

  return await getComponentTemplate(componentId, ...parts);
};

/**
 * Transforms the component tokens into a preview and code
 */
const transformComponentTokens = async (componentId: string, component: Component): Promise<TransformComponentTokensResult> => {
  const template = await getComponentTemplateByComponentId(componentId, component);

  if (!template) {
    return null;
  }

  const parts: Record<string, any> = {};

  if (component.parts) {
    Object.keys(component.parts).forEach((part) => {
      parts[part] = mergeTokenSets(component.parts![part]);
    });
  }

  const renderableComponent: Omit<Component, 'parts'> & { parts: any } = {
    ...component,
    parts,
  };

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
  const componenetIds = Object.keys(components);

  const result = await Promise.all(
    componenetIds.map(async (componentId) => {
      return [componentId, await Promise.all(
        documentationObject.components[componentId].map((component) => transformComponentTokens(componentId, component))
      ).then((res) => res.filter(filterOutNull))] as [string, TransformComponentTokensResult[]];
    })
  );

  let previews = result.reduce(
    (obj, el) => {
      obj[el[0]] = el[1];
      return obj;
    }, {} as { [key: string]: TransformComponentTokensResult[] }
  );

  return {
    components: previews,
  };
}
