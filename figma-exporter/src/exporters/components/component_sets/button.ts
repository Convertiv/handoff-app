import uniq from 'lodash/uniq';
import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
import { filterOutNull } from '../../../utils';
import { findChildNodeWithType, getComponentNamePart, isValidTheme, normalizeNamePart } from '../utils';

export type ButtonComponents = ButtonComponent[];

export interface ButtonComponentTokens {
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

  // Typography
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
  textDecoration: FigmaTypes.TypeStyle['textDecoration'];
  textCase: FigmaTypes.TypeStyle['textCase'];
  color: FigmaTypes.Paint[];

  // Effects
  effects: FigmaTypes.Effect[];

  // Opacity
  opacity: number;

  /**
   * Contents of the text node
   */
  characters: string;
}

export interface ButtonDesignComponent extends ButtonComponentTokens {
  componentType: 'design';
  /**
   * Component theme (light, dark)
   *
   * @default 'light'
   */
  theme: 'light' | 'dark';
  /**
   * Component type (primary, secondary, tertiary, etc.)
   *
   * @default 'primary'
   */
  type: string;
  /**
   * Component state (default, hover, disabled)
   *
   * @default 'default'
   */
  state: 'default' | 'hover' | 'disabled';
}

export interface ButtonLayoutComponent extends ButtonComponentTokens {
  componentType: 'layout';
  /**
   * Component size (lg, md, sm, xs, ...)
   */
  size: string;
}

export type ButtonComponent = ButtonDesignComponent | ButtonLayoutComponent;

/**
 * Is this a valid state for a button?
 *
 * @param state
 * @returns boolean
 */
const isValidState = (state: string): state is ButtonDesignComponent['state'] => {
  return ['default', 'hover', 'disabled'].includes(state);
};

/**
 * Fetch all button compnents from the button component object and
 * transform into ButtonComponents
 * @param buttonComponents
 * @returns ButtonComponents
 */
export default function extractButtonComponents(buttonComponents: GetComponentSetComponentsResult): ButtonComponents {
  const allButtons = buttonComponents.components
    .map((buttonComponent): ButtonComponent | null => {
      const theme = normalizeNamePart(getComponentNamePart(buttonComponent.name, 'Theme') ?? 'light');
      const type = normalizeNamePart(getComponentNamePart(buttonComponent.name, 'Type') ?? 'default');
      const state = normalizeNamePart(getComponentNamePart(buttonComponent.name, 'State') ?? 'default');
      const size = normalizeNamePart(getComponentNamePart(buttonComponent.name, 'Size') ?? '');

      const instanceNode = size ? buttonComponent : findChildNodeWithType(buttonComponent, 'INSTANCE');
      if (!instanceNode) {
        throw new Error(`No instance node found for button ${buttonComponent.name}`);
      }

      const textNode = findChildNodeWithType(instanceNode, 'TEXT');
      if (!textNode) {
        throw new Error(`No text node found for button ${buttonComponent.name}`);
      }

      // Description
      const description = buttonComponents.metadata[buttonComponent.id]?.description ?? '';

      // Background color
      const background = instanceNode.background.slice();

      // Padding
      const paddingTop = instanceNode.paddingTop ?? 0;
      const paddingRight = instanceNode.paddingRight ?? 0;
      const paddingBottom = instanceNode.paddingBottom ?? 0;
      const paddingLeft = instanceNode.paddingLeft ?? 0;

      // Border
      const borderWeight = instanceNode.strokeWeight ?? 0;
      const borderRadius = instanceNode.cornerRadius ?? 0;
      const borderColor = instanceNode.strokes.slice();

      // Text
      const fontFamily = textNode.style.fontFamily;
      const fontSize = textNode.style.fontSize;
      const fontWeight = textNode.style.fontWeight;
      const lineHeight = (textNode.style.lineHeightPercentFontSize ?? 100) / 100;
      const letterSpacing = textNode.style.letterSpacing;
      const textAlign = textNode.style.textAlignHorizontal;
      const textDecoration = textNode.style.textDecoration ?? 'NONE';
      const textCase = textNode.style.textCase ?? 'ORIGINAL';
      const color = textNode.fills.slice();

      // Shadow
      const effects = [...instanceNode.effects];

      // Opacity
      const opacity = buttonComponent.opacity ?? 1;

      // Characters
      const characters = textNode.characters;

      const tokens: Omit<ButtonComponentTokens, 'id'> = {
        description,
        background,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        borderWeight,
        borderRadius,
        borderColor,
        fontFamily,
        fontSize,
        fontWeight,
        lineHeight,
        letterSpacing,
        textAlign,
        textDecoration,
        textCase,
        color,
        effects,
        opacity,
        characters,
      };

      if (size) {
        return {
          id: `layout-size-${size}`,
          componentType: 'layout',
          size,
          ...tokens,
        };
      }

      // We shouldn't validate themes or state this way
      // TODO: allow other states and themes, and don't
      // require these theme names
      if (!isValidTheme(theme) || !isValidState(state)) {
        return null;
      }

      return {
        id: `design-theme-${theme}-type-${type}-state-${state}`,
        componentType: 'design',
        theme,
        type,
        state,
        ...tokens,
      };
    })
    .filter(filterOutNull);

  const designComponents = allButtons.filter((component): component is ButtonDesignComponent => component.componentType === 'design');

  const disabledButtonLight = designComponents.find((button) => button.theme === 'light' && button.state === 'disabled');
  let disabledButtonDark = designComponents.find((button) => button.theme === 'dark' && button.state === 'disabled');
  if (!disabledButtonLight) {
    throw new Error('No disabled button light found');
  }
  let dark = false;
  if (designComponents.filter((comp) => comp.theme === 'dark').length > 0) {
    // There is a dark theme in this project
    dark = true;
    if (!disabledButtonDark) {
      console.log('No disabled button dark found. Defaulting to light disabled button.');
    }
  }

  const types = uniq(designComponents.map((button) => button.type));
  const themes = uniq(designComponents.map((button) => button.theme));
  return themes
    .flatMap((theme) => {
      if (!dark && theme === 'dark') {
        return [];
      }
      return types.flatMap((type) => {
        return (['default', 'hover', 'disabled'] as const).map((state): ButtonComponent => {
          const button = designComponents.find((button) => button.theme === theme && button.type === type && button.state === state);
          if (!button) {
            // If the state is disabled
            if (state === 'disabled') {
              if (disabledButtonDark) {
                return { ...(theme === 'light' ? disabledButtonLight : disabledButtonDark), theme, type };
              } else {
                return { ...disabledButtonLight, theme, type };
              }
            }
            throw new Error(`No button found for theme=${theme}, type=${type}, state=${state}`);
          }
          return button;
        });
      });
    })
    .concat(allButtons.filter((component): component is ButtonLayoutComponent => component.componentType === 'layout'));
}
