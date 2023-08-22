import Mustache from 'mustache';
import { parse } from 'node-html-parser';
import { DocumentationObject, ExportableSharedOptions, ExportableTransformerOptions } from '../../types';
import { filterOutNull, slugify } from '../../utils/index';
import { getComponentTemplate } from './utils';
import { Component } from '../../exporters/components/extractor';
import { TokenSets } from '../../exporters/components/types';
import { TransformComponentTokensResult } from './types';
import { ExportableTransformerOptionsMap } from '../types';

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

const getComponentTemplateByComponentId = async (componentId: string, component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions): Promise<GetComponentTemplateByComponentIdResult> => {
  const parts: string[] = [];

  component.variantProperties.forEach(([_, value]) => {
    parts.push(value);
  });

  return await getComponentTemplate(componentId, ...parts);
};

/**
 * Transforms the component tokens into a preview and code
 */
const transformComponentTokens = async (componentId: string, component: Component, options?: ExportableTransformerOptions & ExportableSharedOptions): Promise<TransformComponentTokensResult> => {
  const template = await getComponentTemplateByComponentId(componentId, component, options);

  if (!template) {
    return null;
  }

  const renderableComponent: Record<string, any> = { props: {}, parts: {} };

  component.variantProperties.forEach(([variantProp, value]) => {
    renderableComponent.props[variantProp] = value;
  });

  if (component.parts) {
    Object.keys(component.parts).forEach((part) => {
      renderableComponent.parts[part] = mergeTokenSets(component.parts![part]);
    });
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
export default async function previewTransformer(documentationObject: DocumentationObject, options?: ExportableTransformerOptionsMap) {
  const { components } = documentationObject;
  const componentNames = Object.keys(components);

  const result = await Promise.all(
    componentNames.map(async (componentName) => {
      return [componentName, await Promise.all(
        documentationObject.components[componentName].map((component) => transformComponentTokens(componentName, component, options?.get(componentName)))
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
