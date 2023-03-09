import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
import { filterOutNull } from '../../../utils';
import { findChildNodeWithType, findChildNodeWithTypeAndName, getComponentNamePart, isValidTheme, normalizeNamePart } from '../utils';

export type InputComponents = InputComponent[];

export interface InputComponentTokens {
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
      characters: string;
      spacing: number | undefined;
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Color;
    };

    // Option
    text: {
      characters: string;
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Color;
    };

    // Icon
    icon: {
      borderWeight: number;
      borderColor: FigmaTypes.Color;
    };

    // Additional info
    additionalInfo: {
      characters: string;
      spacing: number | undefined;
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Color;
    };
  };
}

export interface InputDesignComponent extends InputComponentTokens {
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
  state: 'default' | 'hover' | 'disabled' | 'error' | 'active' | 'complete';
}

export interface InputLayoutComponent extends InputComponentTokens {
  componentType: 'layout';
  /**
   * Component size (small, medium, large)
   */
  size: string;
}

export type InputComponent = InputDesignComponent | InputLayoutComponent;

/**
 * Validate input states.  We only can handle the following states
 * 'default', 'hover', 'disabled', 'active', 'error'
 * @param state
 * @returns boolean
 */
const isValidState = (state: string): state is InputDesignComponent['state'] => {
  return ['default', 'hover', 'disabled', 'active', 'error', 'complete'].includes(state);
};

/**
 * Extract input components
 * @param inputComponents
 * @returns InputComponents
 */
export default function extractInputComponents(inputComponents: GetComponentSetComponentsResult): InputComponents {
  return inputComponents.components
    .map((inputComponent): InputComponent | null => {
      const theme = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Theme') ?? 'light');
      const state = normalizeNamePart(getComponentNamePart(inputComponent.name, 'State') ?? 'default');
      const size = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Size') ?? '');

      const instanceNode = size ? inputComponent : findChildNodeWithType(inputComponent, 'INSTANCE');
      if (!instanceNode) {
        throw new Error(`No instance node found for input component ${inputComponent.name}`);
      }

      const inputNode = findChildNodeWithTypeAndName(instanceNode, 'FRAME', ':: input');
      if (!inputNode) {
        throw new Error(`No input node found for input component ${inputComponent.name}`);
      }

      const labelNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Input Label');
      if (!labelNode) {
        throw new Error(`No label node found for input component ${inputComponent.name}`);
      }

      const textNode = findChildNodeWithTypeAndName(inputNode, 'TEXT', 'Input Text');
      if (!textNode) {
        throw new Error(`No text node found for input component ${inputComponent.name}`);
      }

      const iconNode = findChildNodeWithType(inputNode, 'VECTOR');
      if (!iconNode) {
        throw new Error(`No icon node found for input component ${inputComponent.name}`);
      }

      const additionalInfoNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Help Text');
      if (!additionalInfoNode) {
        throw new Error(`No additional info node found for input component ${inputComponent.name}`);
      }

      // Description
      const description = inputComponents.metadata[inputComponent.id]?.description ?? '';

      // Background color
      const background = inputNode.background.slice();

      // Padding
      const paddingTop = inputNode.paddingTop ?? 0;
      const paddingRight = inputNode.paddingRight ?? 0;
      const paddingBottom = inputNode.paddingBottom ?? 0;
      const paddingLeft = inputNode.paddingLeft ?? 0;

      // Border
      const borderWeight = inputNode.strokeWeight ?? 0;
      const borderRadius = inputNode.cornerRadius ?? 0;
      const borderColor = inputNode.strokes.slice();

      // Label
      const label: InputComponentTokens['parts']['label'] = {
        characters: labelNode.characters ?? '',
        spacing: instanceNode.layoutMode === 'VERTICAL' ? instanceNode.itemSpacing : undefined,
        fontFamily: labelNode.style.fontFamily,
        fontSize: labelNode.style.fontSize,
        fontWeight: labelNode.style.fontWeight,
        lineHeight: (labelNode.style.lineHeightPercentFontSize ?? 100) / 100,
        letterSpacing: labelNode.style.letterSpacing,
        textAlign: labelNode.style.textAlignHorizontal,
        textDecoration: labelNode.style.textDecoration ?? 'NONE',
        textCase: labelNode.style.textCase ?? 'ORIGINAL',
        color: labelNode.fills[0]?.color ?? { r: 0, g: 0, b: 0, a: 0 },
      };

      // Option
      const text: InputComponentTokens['parts']['text'] = {
        characters: textNode.characters ?? '',
        fontFamily: textNode.style.fontFamily,
        fontSize: textNode.style.fontSize,
        fontWeight: textNode.style.fontWeight,
        lineHeight: (textNode.style.lineHeightPercentFontSize ?? 100) / 100,
        letterSpacing: textNode.style.letterSpacing,
        textAlign: textNode.style.textAlignHorizontal,
        textDecoration: textNode.style.textDecoration ?? 'NONE',
        textCase: textNode.style.textCase ?? 'ORIGINAL',
        color: textNode.fills[0]?.color ?? { r: 0, g: 0, b: 0, a: 0 },
      };

      const icon: InputComponentTokens['parts']['icon'] = {
        borderWeight: iconNode.strokeWeight ?? 0,
        borderColor: iconNode.strokes[0]?.color ?? { r: 0, g: 0, b: 0, a: 0 },
      };

      const additionalInfo: InputComponentTokens['parts']['additionalInfo'] = {
        characters: additionalInfoNode.characters ?? '',
        spacing: instanceNode.layoutMode === 'VERTICAL' ? instanceNode.itemSpacing : undefined,
        fontFamily: additionalInfoNode.style.fontFamily,
        fontSize: additionalInfoNode.style.fontSize,
        fontWeight: additionalInfoNode.style.fontWeight,
        lineHeight: (additionalInfoNode.style.lineHeightPercentFontSize ?? 100) / 100,
        letterSpacing: additionalInfoNode.style.letterSpacing,
        textAlign: additionalInfoNode.style.textAlignHorizontal,
        textDecoration: additionalInfoNode.style.textDecoration ?? 'NONE',
        textCase: additionalInfoNode.style.textCase ?? 'ORIGINAL',
        color: additionalInfoNode.fills[0]?.color ?? { r: 0, g: 0, b: 0, a: 0 },
      };

      const effects = [...inputNode.effects];

      const tokens: Omit<InputComponentTokens, 'id'> = {
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
          text,
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
