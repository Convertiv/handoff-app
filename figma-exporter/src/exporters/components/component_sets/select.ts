import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
import { filterOutNull } from '../../../utils';
import { findChildNodeWithType, findChildNodeWithTypeAndName, getComponentNamePart, isValidTheme, normalizeNamePart } from '../utils';

export type SelectComponents = SelectComponent[];

export interface SelectComponentTokens {
  id: string;

  // Description
  description: string;

  // Background
  background: FigmaTypes.Paint[];

  // Padding
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;

  // Border
  borderWeight: number;
  borderRadius: number;
  borderColor: FigmaTypes.Paint[];

  // Effects
  effects: FigmaTypes.Effect[];

  parts: {
    // Label
    label: {
      spacing: number | undefined;
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Paint[];
    };

    // Option
    option: {
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Paint[];
    };

    // Icon
    icon: {
      width: number;
      height: number;
      color: FigmaTypes.Paint[];
    };

    // Additional info
    additionalInfo: {
      spacing: number | undefined;
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Paint[];
    };
  };
}

export interface SelectDesignComponent extends SelectComponentTokens {
  componentType: 'design';
  /**
   * Component theme (light, dark)
   *
   * @default 'light'
   */
  theme: 'light' | 'dark';
  /**
   * Component state (default, hover, disabled)
   *
   * @default 'Default'
   */
  state: 'default' | 'hover' | 'disabled' | 'error';
}

export interface SelectLayoutComponent extends SelectComponentTokens {
  componentType: 'layout';
  /**
   * Component size (xl, lg, md, sm, xs)
   */
  size: string;
}

export type SelectComponent = SelectDesignComponent | SelectLayoutComponent;

const isValidState = (state: string): state is SelectDesignComponent['state'] => {
  return ['default', 'hover', 'disabled', 'active', 'error'].includes(state);
};

export default function extractSelectComponents(selectComponents: GetComponentSetComponentsResult): SelectComponents {
  return selectComponents.components
    .map((selectComponent): SelectComponent | null => {
      const theme = normalizeNamePart(getComponentNamePart(selectComponent.name, 'Theme') ?? 'light');
      const state = normalizeNamePart(getComponentNamePart(selectComponent.name, 'State') ?? 'default');
      const size = normalizeNamePart(getComponentNamePart(selectComponent.name, 'Size') ?? '');

      const instanceNode = size ? selectComponent : findChildNodeWithType(selectComponent, 'INSTANCE');
      if (!instanceNode) {
        throw new Error(`No instance node found for select component ${selectComponent.name}`);
      }

      const selectNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', ':: select');
      if (!selectNode) {
        throw new Error(`No select node found for select component ${selectComponent.name}`);
      }

      const labelNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Select Label');
      if (!labelNode) {
        throw new Error(`No label node found for select component ${selectComponent.name}`);
      }

      const optionNode = findChildNodeWithTypeAndName(selectNode, 'TEXT', 'Select Option');
      if (!optionNode) {
        throw new Error(`No option node found for select component ${selectComponent.name}`);
      }

      const overlayNode = findChildNodeWithTypeAndName(selectNode, 'RECTANGLE', 'Color');
      if (!overlayNode) {
        throw new Error(`No overlay node found for input component ${selectNode.name}`);
      }

      const iconNode = findChildNodeWithTypeAndName(instanceNode, 'INSTANCE', 'Caret');
      if (!iconNode) {
        throw new Error(`No icon node found for select component ${selectComponent.name}`);
      }

      const additionalInfoNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Additional Info');
      if (!additionalInfoNode) {
        throw new Error(`No additional info node found for select component ${selectComponent.name}`);
      }

      // Description
      const description = selectComponents.metadata[selectComponent.id]?.description ?? '';

      // Background color
      const background = selectNode.background.slice();

      // Padding
      const paddingTop = selectNode.paddingTop ?? 0;
      const paddingRight = selectNode.paddingRight ?? 0;
      const paddingBottom = selectNode.paddingBottom ?? 0;
      const paddingLeft = selectNode.paddingLeft ?? 0;

      // Border
      const borderWeight = selectNode.strokeWeight ?? 0;
      const borderRadius = selectNode.cornerRadius ?? 0;
      const borderColor = selectNode.strokes.slice();

      // Effects
      const effects = [...selectNode.effects];

      // Label
      const label: SelectComponentTokens['parts']['label']  = {
        spacing: instanceNode.layoutMode === 'VERTICAL' ? instanceNode.itemSpacing : undefined,
        fontFamily: labelNode.style.fontFamily,
        fontSize: labelNode.style.fontSize,
        fontWeight: labelNode.style.fontWeight,
        lineHeight: (labelNode.style.lineHeightPercentFontSize ?? 100) / 100,
        letterSpacing: labelNode.style.letterSpacing,
        textAlign: labelNode.style.textAlignHorizontal,
        textDecoration: labelNode.style.textDecoration ?? 'NONE',
        textCase: labelNode.style.textCase ?? 'ORIGINAL',
        color: labelNode.fills.slice(),
      };

      // Option
      const option: SelectComponentTokens['parts']['option']  = {
        fontFamily: optionNode.style.fontFamily,
        fontSize: optionNode.style.fontSize,
        fontWeight: optionNode.style.fontWeight,
        lineHeight: (optionNode.style.lineHeightPercentFontSize ?? 100) / 100,
        letterSpacing: optionNode.style.letterSpacing,
        textAlign: optionNode.style.textAlignHorizontal,
        textDecoration: optionNode.style.textDecoration ?? 'NONE',
        textCase: optionNode.style.textCase ?? 'ORIGINAL',
        color: optionNode.fills.slice(),
      };

      const icon: SelectComponentTokens['parts']['icon'] = {
        width: iconNode.absoluteBoundingBox.width,
        height: iconNode.absoluteBoundingBox.height,
        color: overlayNode?.fills.slice(),
      };

      const additionalInfo: SelectComponentTokens['parts']['additionalInfo']  = {
        spacing: instanceNode.layoutMode === 'VERTICAL' ? instanceNode.itemSpacing : undefined,
        fontFamily: additionalInfoNode.style.fontFamily,
        fontSize: additionalInfoNode.style.fontSize,
        fontWeight: additionalInfoNode.style.fontWeight,
        lineHeight: (additionalInfoNode.style.lineHeightPercentFontSize ?? 100) / 100,
        letterSpacing: additionalInfoNode.style.letterSpacing,
        textAlign: additionalInfoNode.style.textAlignHorizontal,
        textDecoration: additionalInfoNode.style.textDecoration ?? 'NONE',
        textCase: additionalInfoNode.style.textCase ?? 'ORIGINAL',
        color: additionalInfoNode.fills.slice(),
      };

      const tokens: Omit<SelectComponentTokens, 'id'> = {
        description,
        background,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        borderWeight,
        borderRadius,
        borderColor,
        effects,
        parts: {
          label,
          option,
          icon,
          additionalInfo,
        },
      };

      if (size) {
        return {
          id: `layout-size-${size}`,
          componentType: 'layout',
          size,
          ...tokens,
        };
      }

      if (!isValidTheme(theme) || !isValidState(state)) {
        return null;
      }

      return {
        id: `design-theme-${theme}-state-${state}`,
        componentType: 'design',
        theme,
        state,
        ...tokens,
      };
    })
    .filter(filterOutNull);
}
