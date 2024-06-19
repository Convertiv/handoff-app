import * as _ from 'lodash-es';
import * as ExportTypes from './types.js';
import * as FigmaTypes from '../../figma/types.js';
import {
  extractComponentInstanceVariantProps,
  findChildNodeWithType,
  findChildNodeWithTypeAndName,
  isExportable,
  isValidNodeType,
} from '../utils.js';
import { Exportable, ComponentDefinition, ComponentPart, LegacyComponentDefinition } from '../../types.js';
import { replaceTokens, slugify } from '../../utils/index.js';

type ExportPipeComponentInstance = Omit<ExportTypes.ComponentInstance, 'variantProperties'> & { variantProperties: Map<string, string> };
type SharedPipeComponentInstance = ExportPipeComponentInstance & { componentId: string };

export default function extractComponentInstances(
  components: { node: FigmaTypes.Component; metadata: FigmaTypes.ComponentMetadata }[],
  definition: ComponentDefinition,
  legacyDefinition?: LegacyComponentDefinition,
): ExportTypes.ComponentInstance[] {
  const options = definition.options;
  const sharedComponentVariantIds = options.exporter.sharedComponentVariants ?? [];

  const sharedInstances: SharedPipeComponentInstance[] = [];
  const componentInstances = components.map((component): ExportPipeComponentInstance[] => {
    const variantProperties = extractComponentInstanceVariantProps(component.node.name, options.exporter.variantProperties);
    const id = generateComponentId(variantProperties);
    const name = slugify(definition.name);
    const description = component.metadata[component.node.id]?.description ?? '';

    let rootNode: FigmaTypes.Component | FigmaTypes.Instance = component.node;

    if (legacyDefinition) {
      let isLayoutComponent = false;

      if (!!legacyDefinition?.options?.exporter?.supportedVariantProps?.layout) {
        legacyDefinition.options.exporter.supportedVariantProps.layout.forEach((layoutVariantProp) => {
          if (!isLayoutComponent && variantProperties.get(layoutVariantProp) !== undefined) {
            isLayoutComponent = true;
          }
        });

        if (!isLayoutComponent) {
          rootNode = findChildNodeWithType(component.node, 'INSTANCE');
        }

        if (!rootNode) {
          throw new Error(`No instance node found for component ${component.node.name}`);
        }
      }
    }

    if (!definition.parts || definition.parts.length === 0) {
      return [];
    }

    const parts = definition.parts.reduce(
      (previous, current) => ({
        ...previous,
        ...{ [current.id]: extractComponentPartTokenSets(rootNode, current, variantProperties) },
      }),
      {}
    );

    const instance = {
      id,
      name,
      description,
      variantProperties: variantProperties,
      parts,
      definitionId: definition.id,
    } as ExportPipeComponentInstance;

    const isSharedComponentVariant = (sharedComponentVariantIds.findIndex((s) => s.componentId === component.node.id) ?? -1) > -1;
    if (isSharedComponentVariant) {
      sharedInstances.push({ ...instance, componentId: component.node.id });
      return [];
    }

    const result: ExportPipeComponentInstance[] = [instance];

    sharedInstances
      .filter((sharedInstance) => {
        const sharedInstanceDefinition = options.exporter.sharedComponentVariants.find(
          (item) => item.componentId === sharedInstance.componentId
        );

        if (!sharedInstanceDefinition) {
          return false;
        }

        if (
          instance.variantProperties.get(sharedInstanceDefinition.sharedVariantProperty) !==
          options.shared.defaults[sharedInstanceDefinition.sharedVariantProperty]
        ) {
          return false;
        }

        if ((sharedInstanceDefinition.distinctiveVariantProperties ?? []).length > 0) {
          for (const distinctiveVariantProperty of sharedInstanceDefinition.distinctiveVariantProperties) {
            if (
              instance.variantProperties.get(distinctiveVariantProperty) !==
              sharedInstance.variantProperties.get(distinctiveVariantProperty)
            ) {
              return false;
            }
          }
        }

        return true;
      })
      .forEach((sharedInstance) => {
        const sharedInstanceDefinition = options.exporter.sharedComponentVariants.find(
          (item) => item.componentId === sharedInstance.componentId
        );

        const additionalInstance: ExportPipeComponentInstance = { ...sharedInstance };

        const additionalInstanceVariantProps = new Map(instance.variantProperties);
        additionalInstanceVariantProps.set(
          sharedInstanceDefinition.sharedVariantProperty,
          sharedInstance.variantProperties.get(sharedInstanceDefinition.sharedVariantProperty)
        );

        additionalInstance.id = generateComponentId(additionalInstanceVariantProps);
        additionalInstance.variantProperties = additionalInstanceVariantProps;

        result.push({
          id: additionalInstance.id,
          name: additionalInstance.name,
          description: additionalInstance.description,
          variantProperties: additionalInstanceVariantProps,
          parts: additionalInstance.parts,
          definitionId: additionalInstance.definitionId,
        });
      });

    return result;
  });

  const instances = componentInstances.reduce((result, current) => {
    return [
      ...result,
      ...current.map((component) => ({
        id: component.id,
        name: component.name,
        description: component.description,
        variantProperties: Array.from(component.variantProperties.entries()),
        parts: component.parts,
        definitionId: component.definitionId,
      })),
    ];
  }, [] as ExportTypes.ComponentInstance[]);

  return _.uniqBy(instances, 'id');
}

function extractComponentPartTokenSets(root: FigmaTypes.Node, part: ComponentPart, tokens: Map<string, string>): ExportTypes.TokenSets {
  if (!part.tokens || part.tokens.length === 0) {
    return [];
  }

  const tokenSets: ExportTypes.TokenSets = [];

  for (const def of part.tokens) {
    if (!def.from || !def.export || def.export.length === 0) {
      continue;
    }

    const node = resolveNodeFromPath(root, def.from, tokens);

    if (!node) {
      continue;
    }

    for (const exportable of def.export) {
      if (!isExportable(exportable)) {
        continue;
      }

      const tokenSet = extractNodeExportable(node, exportable);

      if (!tokenSet) {
        continue;
      }

      const conflictingTokenSetIdx = tokenSets.map((set) => set.name).indexOf(exportable);

      if (conflictingTokenSetIdx > -1) {
        tokenSets[conflictingTokenSetIdx] = mergeTokenSets(tokenSets[conflictingTokenSetIdx], tokenSet);
      } else {
        tokenSets.push(tokenSet);
      }
    }
  }

  return tokenSets;
}

function resolveNodeFromPath(root: FigmaTypes.Node, path: string, tokens: Map<string, string>) {
  const pathArr = path
    .split('>')
    .filter((part) => part !== '$')
    .map((part) => part.trim());
  let currentNode: FigmaTypes.Node | null = root;

  for (const path of pathArr) {
    const nodeDef = parsePathNodeParams(path);

    if (!nodeDef.type) {
      continue;
    }

    if (nodeDef.name) {
      nodeDef.name = replaceTokens(nodeDef.name, tokens);
    }

    currentNode = nodeDef.name
      ? findChildNodeWithTypeAndName(currentNode, nodeDef.type, nodeDef.name)
      : findChildNodeWithType(currentNode, nodeDef.type);

    if (!currentNode) {
      return null;
    }
  }

  return currentNode;
}

function parsePathNodeParams(path: string): { type?: FigmaTypes.Node['type']; name?: string } {
  const type = path.split('[')[0];
  const selectors = new Map<string, string>();

  const selectorsMatch = path.match(/\[(.*?)\]/);

  if (selectorsMatch) {
    selectorsMatch[1].split(',').forEach((selector) => {
      const [key, value] = selector.split('=');

      if (!(key && value)) {
        return;
      }

      selectors.set(key, value.replace(/['"]/g, ''));
    });
  }

  return {
    type: isValidNodeType(type) ? type : undefined,
    name: selectors.get('name'),
  };
}

function mergeTokenSets(first: ExportTypes.TokenSet, second: ExportTypes.TokenSet): ExportTypes.TokenSet {
  return _.mergeWith({}, first, second, (a, b) => (b === null ? a : undefined));
}

function generateComponentId(variantProperties: Map<string, string>) {
  const parts = [];

  variantProperties.forEach((val, variantProp) => {
    parts.push(`${variantProp}-${val}`);
  });

  return parts.join('-');
}

function extractNodeFill(node: FigmaTypes.Node): ExportTypes.FillTokenSet | null {
  return {
    name: 'FILL',
    color: 'fills' in node ? node.fills.slice() : [],
  };
}

function extractNodeTypography(node: FigmaTypes.Node): ExportTypes.TypographyTokenSet | null {
  const styleInNode = 'style' in node;
  const charactersInNode = 'style' in node;
  return {
    name: 'TYPOGRAPHY',
    fontFamily: styleInNode ? node.style.fontFamily : '',
    fontSize: styleInNode ? node.style.fontSize : 16,
    fontWeight: styleInNode ? node.style.fontWeight : 100,
    lineHeight: styleInNode ? (node.style.lineHeightPercentFontSize ?? 100) / 100 : 1,
    letterSpacing: styleInNode ? node.style.letterSpacing : 0,
    textAlignHorizontal: styleInNode ? node.style.textAlignHorizontal : 'LEFT',
    textDecoration: styleInNode ? node.style.textDecoration ?? 'NONE' : 'NONE',
    textCase: styleInNode ? node.style.textCase ?? 'ORIGINAL' : 'ORIGINAL',
    characters: charactersInNode ? node.characters : '',
  };
}

function extractNodeEffect(node: FigmaTypes.Node): ExportTypes.EffectTokenSet | null {
  return {
    name: 'EFFECT',
    effect: 'effects' in node ? [...node.effects] : [],
  };
}

function extractNodeBorder(node: FigmaTypes.Node): ExportTypes.BorderTokenSet | null {
  return {
    name: 'BORDER',
    weight: 'strokeWeight' in node ? node.strokeWeight ?? 0 : 0,
    radius: 'cornerRadius' in node ? node.cornerRadius ?? 0 : 0,
    strokes: 'strokes' in node ? node.strokes.slice() : [],
    dashes: 'strokeDashes' in node ? node.strokeDashes.concat() : [0, 0],
  };
}

function extractNodeSpacing(node: FigmaTypes.Node): ExportTypes.SpacingTokenSet | null {
  return {
    name: 'SPACING',
    padding: {
      TOP: 'paddingTop' in node ? node.paddingTop ?? 0 : 0,
      RIGHT: 'paddingRight' in node ? node.paddingRight ?? 0 : 0,
      BOTTOM: 'paddingBottom' in node ? node.paddingBottom ?? 0 : 0,
      LEFT: 'paddingLeft' in node ? node.paddingLeft ?? 0 : 0,
    },
    spacing: 'itemSpacing' in node ? node.itemSpacing ?? 0 : 0,
  };
}

function extractNodeBackground(node: FigmaTypes.Node): ExportTypes.BackgroundTokenSet | null {
  return {
    name: 'BACKGROUND',
    background: 'background' in node ? node.background.slice() : [],
  };
}

function extractNodeOpacity(node: FigmaTypes.Node): ExportTypes.OpacityTokenSet | null {
  return {
    name: 'OPACITY',
    opacity: 'opacity' in node ? node.opacity ?? 1 : 1,
  };
}

function extractNodeSize(node: FigmaTypes.Node): ExportTypes.SizeTokenSet | null {
  return {
    name: 'SIZE',
    width: 'absoluteBoundingBox' in node ? node.absoluteBoundingBox.width ?? 0 : 0,
    height: 'absoluteBoundingBox' in node ? node.absoluteBoundingBox.height ?? 0 : 0,
  };
}

function extractNodeExportable(node: FigmaTypes.Node, exportable: Exportable): ExportTypes.TokenSet | null {
  switch (exportable) {
    case 'BACKGROUND':
      return extractNodeBackground(node);
    case 'SPACING':
      return extractNodeSpacing(node);
    case 'BORDER':
      return extractNodeBorder(node);
    case 'EFFECT':
      return extractNodeEffect(node);
    case 'TYPOGRAPHY':
      return extractNodeTypography(node);
    case 'FILL':
      return extractNodeFill(node);
    case 'OPACITY':
      return extractNodeOpacity(node);
    case 'SIZE':
      return extractNodeSize(node);
    default:
      return null;
  }
}
