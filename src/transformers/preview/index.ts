import Mustache from 'mustache';
import { parse } from 'node-html-parser';
import { DocumentationObject, ComponentDefinitionOptions } from '../../types';
import { filterOutNull } from '../../utils/index';
import { getComponentTemplate } from './utils';
import { ComponentInstance } from '../../exporters/components/types';
import { TokenSets } from '../../exporters/components/types';
import { TransformComponentTokensResult } from './types';
import Handoff from '../../index';

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

const getComponentTemplateByComponentId = async (
  handoff: Handoff,
  componentId: string,
  component: ComponentInstance
): Promise<GetComponentTemplateByComponentIdResult> => {
  const parts: string[] = [];

  component.variantProperties.forEach(([_, value]) => parts.push(value));

  return await getComponentTemplate(handoff, componentId, parts);
};

/**
 * Transforms the component tokens into a preview and code
 */
const transformComponentTokens = async (
  handoff: Handoff,
  componentId: string,
  component: ComponentInstance
): Promise<TransformComponentTokensResult> => {
  if (!handoff) {
    throw Error('Handoff not initialized');
  }

  if (!handoff.config.integration) {
    return null;
  }

  const template = await getComponentTemplateByComponentId(handoff, componentId, component);

  if (!template) {
    return null;
  }

  const renderableComponent: Record<string, any> = { variant: {}, parts: {} };

  component.variantProperties.forEach(([variantProp, value]) => {
    renderableComponent.variant[variantProp] = value;
  });

  if (component.parts) {
    Object.keys(component.parts).forEach((part) => {
      renderableComponent.parts[part] = mergeTokenSets(component.parts![part]);
    });
  }

  let preview = Mustache.render(template, renderableComponent);

  if (handoff.config.app.base_path) {
    preview = preview.replace(/(?:href|src|ref)=["']([^"']+)["']/g, (match, capturedGroup) => {
      return match.replace(capturedGroup, handoff.config.app.base_path + capturedGroup);
    });
  }

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
export default async function previewTransformer(handoff: Handoff, documentationObject: DocumentationObject) {
  const { components } = documentationObject;
  const componentIds = Object.keys(components);

  const result = await Promise.all(
    componentIds.map(async (componentId) => {
      return [
        componentId,
        await Promise.all(
          documentationObject.components[componentId].instances.map((instance) => {
            return transformComponentTokens(handoff, componentId, instance);
          })
        ).then((res) => res.filter(filterOutNull)),
      ] as [string, TransformComponentTokensResult[]];
    })
  );

  let previews = result.reduce((obj, el) => {
    obj[el[0]] = el[1];
    return obj;
  }, {} as { [key: string]: TransformComponentTokensResult[] });

  return {
    components: previews,
  };
}
