import _ from 'lodash';
import * as ExportTypes from './types';
import * as FigmaTypes from '../../figma/types';
import {
  findChildNodeWithType,
  findChildNodeWithTypeAndName,
  getComponentNamePart,
  isExportable,
  isValidNodeType,
  isValidVariantProperty,
  normalizeNamePart,
} from '../utils.js';
import { Exportable, ExportableDefinition, ExportablePart, VariantProperty } from '../../types';
import { GetComponentSetComponentsResult } from '.';
import { filterOutNull } from '../../utils/index.js';

interface NodePathTokens {
  activity: ComponentDesign['activity'];
}

interface ComponentBase {
  id: string;
  name: string;
  description?: string;
  parts?: { [key: string]: ExportTypes.TokenSets };
}

export interface ComponentDesign extends ComponentBase {
  componentType: 'design';
  /**
   * Component theme (light, dark)
   */
  theme?: string;

  /**
   * Component type (primary, secondary, tertiary, etc.)
   */
  type?: string;

  /**
   * Component state (default, hover, disabled, etc.)
   */
  state?: string;

  /**
   * Component activity (on, off)
   */
  activity?: string;
}

export interface ComponentLayout extends ComponentBase {
  componentType: 'layout';
  /**
   * Component layout
   */
  layout?: string;

  /**
   * Component size (lg, md, sm, xs, ...)
   */
  size?: string;
}

export type Component = ComponentDesign | ComponentLayout;

export default function extractComponents(
  componentSetComponentsResult: GetComponentSetComponentsResult,
  definition: ExportableDefinition
): Component[] {
  const supportedVariantPropertiesWithParams = getComponentSupportedVariantProperties(definition);
  const supportedVariantProperties = supportedVariantPropertiesWithParams.map((item) => item.property);

  const stateVariantProperty = supportedVariantPropertiesWithParams.filter((item) => item.property === 'STATE');
  const componentSharedStates = stateVariantProperty.length > 0 ? stateVariantProperty[0].params : null;

  const sharedStateComponents: { [state: string]: { [theme: string]: ComponentDesign } } = {};

  const components = _.uniqBy(
    componentSetComponentsResult.components
      .map((component): Component | null => {
        // Design
        const theme = supportedVariantProperties.includes('THEME')
          ? normalizeNamePart(getComponentNamePart(component.name, 'Theme') ?? definition.options?.shared?.defaults?.theme ?? '')
          : undefined;
        const type = supportedVariantProperties.includes('TYPE')
          ? normalizeNamePart(getComponentNamePart(component.name, 'Type') ?? definition.options?.shared?.defaults?.type ?? '')
          : undefined;
        const state = supportedVariantProperties.includes('STATE')
          ? normalizeNamePart(getComponentNamePart(component.name, 'State') ?? definition.options?.shared?.defaults?.state ?? '')
          : undefined;
        const activity = supportedVariantProperties.includes('ACTIVITY')
          ? normalizeNamePart(getComponentNamePart(component.name, 'Activity') ?? definition.options?.shared?.defaults?.activity ?? '')
          : undefined;
        // Layout
        const layout = supportedVariantProperties.includes('LAYOUT')
          ? normalizeNamePart(getComponentNamePart(component.name, 'Layout') ?? definition.options?.shared?.defaults?.layout ?? '')
          : undefined;
        const size = supportedVariantProperties.includes('SIZE')
          ? normalizeNamePart(getComponentNamePart(component.name, 'Size') ?? definition.options?.shared?.defaults?.size ?? '')
          : undefined;

        const instanceNode = layout || size ? component : findChildNodeWithType(component, 'INSTANCE');

        if (!instanceNode) {
          throw new Error(`No instance node found for component ${component.name}`);
        }

        const partsToExport = definition.parts;

        if (!partsToExport) {
          return null;
        }

        const parts = partsToExport.reduce((previous, current) => {
          const tokenSets = extractComponentPartTokenSets(instanceNode, current, { activity });
          return { ...previous, ...{ [current.id]: tokenSets } };
        }, {});

        const name = definition.id ?? '';
        const description = componentSetComponentsResult.metadata[component.id]?.description ?? '';

        if (layout || size) {
          return {
            id: generateLayoutId(layout, size),
            name,
            description,
            componentType: 'layout',
            size,
            layout,
            parts,
          };
        }

        const designComponent: Component = {
          id: generateDesignId(theme, type, state, activity),
          name,
          description,
          theme,
          type,
          state,
          activity,
          componentType: 'design',
          parts,
        };

        if (state && (componentSharedStates ?? []).includes(state)) {
          sharedStateComponents[state] ??= {};
          sharedStateComponents[state][theme ?? definition.options?.shared?.defaults?.theme ?? ''] = designComponent;
          return null;
        }

        return designComponent;
      })
      .filter(filterOutNull),
    'id'
  );

  if (componentSharedStates && Object.keys(sharedStateComponents).length > 0) {
    components
      .filter((component): component is ComponentDesign => {
        return component.componentType === 'design' && component.state === (definition.options?.shared?.defaults?.state ?? '');
      })
      .forEach((component) => {
        Object.keys(sharedStateComponents).forEach((stateToApply) => {
          const sharedStateComponent =
            sharedStateComponents[stateToApply][component.theme ?? definition.options?.shared?.defaults?.theme ?? ''];
          components.push({
            ...sharedStateComponent,
            id: generateDesignId(component.theme, component.type, sharedStateComponent.state, component.activity),
            theme: component.theme,
            type: component.type,
            activity: component.activity,
          });
        });
      });
  }

  return components;
}

function extractComponentPartTokenSets(root: FigmaTypes.Node, part: ExportablePart, tokens: NodePathTokens): ExportTypes.TokenSets {
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

function resolveNodeFromPath(root: FigmaTypes.Node, path: string, tokens: NodePathTokens) {
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

    nodeDef.name = nodeDef.name ? nodeDef.name.replaceAll('$activity', tokens?.activity ?? '') : nodeDef.name;

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

function getComponentSupportedVariantProperties(
  definition: ExportableDefinition
): { property: VariantProperty; params: string[] | null }[] {
  return (definition.options.exporter.supportedVariantProps ?? [])
    .map((variantProperty) => {
      const regex = /^([^:]+)(?:\(([^)]+)\))?$/;
      const matches = variantProperty.match(regex);

      if (!matches || matches.length !== 3) {
        return null; // ignore if format is invalid
      }

      const key = matches[1].trim();
      const value = matches[2]?.trim();

      if (!isValidVariantProperty(key)) {
        return null; // ignore if variant property isn't supported
      }

      return {
        property: key,
        params: value ? value.substring(1).split(':') : null,
      };
    })
    .filter(filterOutNull);
}

function generateDesignId(theme?: string, type?: string, state?: string, activity?: string) {
  const parts = ['design'];

  if (theme !== undefined) parts.push(`theme-${theme}`);
  if (type !== undefined) parts.push(`type-${type}`);
  if (state !== undefined) parts.push(`state-${state}`);
  if (activity !== undefined) parts.push(`activity-${activity}`);

  return parts.join('-');
}

function generateLayoutId(layout?: string, size?: string) {
  const parts = [];

  if (layout) parts.push(`layout-${layout}`);
  if (size) parts.push(`size-${size}`);

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
