import _ from 'lodash';
import * as ExportTypes from './types';
import * as FigmaTypes from '../../figma/types';
import {
  extractComponentVariantProps,
  findChildNodeWithType,
  findChildNodeWithTypeAndName,
  isExportable,
  isValidNodeType,
} from '../utils';
import { Exportable, ExportableDefinition, ExportablePart, VariantPropertyWithParams } from '../../types';
import { GetComponentSetComponentsResult } from '.';
import { filterOutNull, replaceTokens } from '../../utils/index';

interface BaseComponent {
  id: string;
  name: string;
  description?: string;
  type: 'design' | 'layout';
  parts?: { [key: string]: ExportTypes.TokenSets };
  theme?: string;
}

interface PipedComponent extends BaseComponent {
  variantProperties: Map<string, string>;
}

export interface Component extends BaseComponent {
  variantProperties: [string, string][];
}

export default function extractComponents(
  componentSetComponentsResult: GetComponentSetComponentsResult,
  definition: ExportableDefinition
): Component[] {
  const sharedComponentVariants: {
    variantProperty: string,
    component: PipedComponent,
  }[] = [];

  const _themeVariantProp = definition?.options?.shared?.roles?.theme;

  const supportedVariantProperties = getComponentSupportedVariantProperties(definition);
  const supportedDesignVariantPropertiesWithSharedVariants = supportedVariantProperties.design.filter(variantProperty => (variantProperty.params ?? []).length > 0);
  const hasAnyVariantPropertiesWithSharedVariants = supportedDesignVariantPropertiesWithSharedVariants.length > 0;

  const components = _.uniqBy(
    componentSetComponentsResult.components
      .map((component): PipedComponent | null => {
        // BEGIN: Get variant properties

        const defaults: {[variantProperty: string]: string} = definition.options?.shared?.defaults ?? {};
        const [designVariantProperties, _] = extractComponentVariantProps(component.name, supportedVariantProperties.design, defaults);
        const [layoutVariantProperties, hasAnyNonDefaultLayoutVariantProperty] = extractComponentVariantProps(component.name, supportedVariantProperties.layout, defaults);

        // END: Get variant properties

        // BEGIN: Set component type indicator

        const isLayoutComponent = hasAnyNonDefaultLayoutVariantProperty;

        // END: Set component type indicator

        // BEGIN: Define required component properties

        const variantProperties = isLayoutComponent ? layoutVariantProperties : designVariantProperties;
        const type = isLayoutComponent ? 'layout' : 'design';
        const description = componentSetComponentsResult.metadata[component.id]?.description ?? '';
        const name = definition.id ?? '';
        const id = generateComponentId(variantProperties, isLayoutComponent);

        // END: Define required component properties

        // BEGIN: Get component parts

        const instanceNode = isLayoutComponent ? component : findChildNodeWithType(component, 'INSTANCE');

        if (!instanceNode) {
          throw new Error(`No instance node found for component ${component.name}`);
        }

        const partsToExport = definition.parts;

        if (!partsToExport) {
          return null;
        }

        const parts = partsToExport.reduce((previous, current) => {
          const tokenSets = extractComponentPartTokenSets(instanceNode, current, variantProperties);
          return { ...previous, ...{ [current.id]: tokenSets } };
        }, {});

        // END: Get component parts

        // BEGIN: Initialize the resulting component

        const theme = _themeVariantProp ? variantProperties.get(_themeVariantProp) : undefined;

        const result: PipedComponent = {
          id,
          name,
          description,
          type,
          variantProperties: variantProperties,
          parts,
          theme
        };

        // END: Initialize the resulting component

        // BEGIN: Store resulting component if component variant should be shared

        let componentVariantIsBeingShared = false;

        if (type === 'design' && hasAnyVariantPropertiesWithSharedVariants) {
          supportedDesignVariantPropertiesWithSharedVariants.forEach(variantProperty => {
            // Get the variant property value of the component and validate that the value is set
            const variantPropertyValue = variantProperties.get(variantProperty.name);

            // Check if the component has a value set for the variant property we are checking
            if (!variantPropertyValue) {
              // If the component doesn't have a value set we bail early
              return;
            }
            
            // Check if the component is set to be shared based on the value of the variant property
            const matchesByComponentVariantPropertyValue = variantProperty.params.filter(val => val === variantPropertyValue) ?? [];

            // Check if there are any matches
            if (matchesByComponentVariantPropertyValue.length === 0) {
              // If there aren't any matches, we bail early
              return;
            }

            // Signal that the component variant is considered to be shared
            componentVariantIsBeingShared = true;

            // Current component is a shared component.
            // We store the component for later when we will do the binding.
            matchesByComponentVariantPropertyValue.forEach(match => {
              sharedComponentVariants.push({
                variantProperty: variantProperty.name,
                component: result
              })
            });
          });
        }

        // END: Store resulting component if component variant should be shared

        if (componentVariantIsBeingShared) {
          return null;
        }

        return result;
      })
      .filter(filterOutNull),
    'id'
  );

  if (sharedComponentVariants.length > 0) {
    sharedComponentVariants.forEach(sharedComponentVariant => {
      const sharedComponentVariantProps = sharedComponentVariant.component.variantProperties;

      components
        .filter((component) => {
          // check if the component is a design component
          if (component.type !== 'design') {
            return false; // ignore component if it's not a design component
          }

          if (sharedComponentVariant.component.theme) {
            if (sharedComponentVariant.component.theme !== component.theme) {
              return false;
            }
          }

          if (component.variantProperties.get(sharedComponentVariant.variantProperty) !== definition.options?.shared?.defaults[sharedComponentVariant.variantProperty]) {
            return false; // ignore if the variant property value is not the default one
          }

          return true;
        })
        .forEach((component) => {
          const componentToPush: PipedComponent = {...sharedComponentVariant.component}

          const componentToPushVariantProps = new Map(component.variantProperties);
          componentToPushVariantProps.set(sharedComponentVariant.variantProperty, sharedComponentVariantProps.get(sharedComponentVariant.variantProperty));

          componentToPush.id = generateComponentId(componentToPushVariantProps, false);
          componentToPush.variantProperties = componentToPushVariantProps;

          components.push(componentToPush);
        });
    });
  }

  return components.map(component => ({
    id: component.id,
    name: component.name,
    description: component.description,
    type: component. type,
    variantProperties: Array.from(component.variantProperties.entries()),
    parts: component.parts,
    theme: component.theme
  }));
}

function extractComponentPartTokenSets(root: FigmaTypes.Node, part: ExportablePart, tokens: Map<string, string>): ExportTypes.TokenSets {
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

function getComponentPropertyWithParams(variantProperty: string): VariantPropertyWithParams {
  const regex = /^([^:]+)(?:\(([^)]+)\))?$/;
  const matches = variantProperty.match(regex);

  if (!matches || matches.length !== 3) {
    return null; // ignore if format is invalid
  }

  const key = matches[1].trim();
  const value = matches[2]?.trim();

  return {
    name: key,
    params: value ? value.substring(1).split(':') : undefined,
  };
}

function getComponentSupportedVariantProperties(definition: ExportableDefinition) {
  return {
    design: (definition?.options?.exporter?.supportedVariantProps?.design ?? []).map((variantProperty) => getComponentPropertyWithParams(variantProperty)),
    layout: (definition?.options?.exporter?.supportedVariantProps?.layout ?? []).map((variantProperty) => getComponentPropertyWithParams(variantProperty)),
  }
}

function generateComponentId(variantProperties: Map<string, string>, isLayoutComponent: boolean) {
  const parts = isLayoutComponent ? [] : ['design'];

  variantProperties.forEach((val, variantProp) => {
    parts.push(`${variantProp}-${val}`)
  })

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
