import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
import { filterOutNull } from '../../../utils';
import { findChildNodeWithType, findChildNodeWithTypeAndName, getComponentNamePart, isValidTheme, normalizeNamePart } from '../utils';


const isValidState = (state: string): state is 'default' | 'disabled' | 'hover' => {
  return ['default', 'hover', 'disabled'].includes(state);
};

const isValidActivity = (activity: string): activity is 'on' | 'off' => {
  return ['on', 'off'].includes(activity);
};
export type RadioComponents = RadioComponent[];

export interface RadioComponentTokens {
  id: string;
  height: number;

  // Description
  description: string;

  // Padding
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;

  // Opacity
  opacity: number;

  parts: {
    check: {
      width: number;
      height: number;
      paddingLeft: number;
      background: FigmaTypes.Paint[];
      // Border
      borderWeight: number;
      borderRadius: number;
      borderColor: FigmaTypes.Paint[];
      // Effects
      effects: FigmaTypes.Effect[];
    };
    // Option
    label: {
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
      opacity: number;
    };
    thumb: {
      // Size
      width: number;
      height: number;
      // Background
      background: FigmaTypes.Paint[];
      // Border
      borderWeight: number;
      borderColor: FigmaTypes.Paint[];
    }
  };
}

export interface RadioLayoutComponent extends RadioComponentTokens {
  componentType: 'layout';
  /**
   * Component size (lg, md, sm, xs, ...)
   */
  size: string;
}

export interface RadioDesignComponent extends RadioComponentTokens {
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
   * @default 'default'
   */
  state: 'default' | 'hover' | 'disabled';

  /**
   * Component theme (light, dark)
   *
   * @default 'light'
   */
  activity: 'on' | 'off';
}
export type RadioComponent = RadioDesignComponent | RadioLayoutComponent;

/**
 * Extract input components
 * @param inputComponents
 * @returns InputComponents
 */
export default function extractRadioComponents(inputComponents: GetComponentSetComponentsResult): RadioComponents {
  return inputComponents.components
    .map((inputComponent): RadioComponent | null => {
      const theme = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Theme') ?? 'light');
      const state = normalizeNamePart(getComponentNamePart(inputComponent.name, 'State') ?? 'default');
      const size = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Size') ?? '');
      const activity = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Activity') ?? '');

      const instanceNode = size ? inputComponent : findChildNodeWithType(inputComponent, 'INSTANCE');
      if (!instanceNode) {
        throw new Error(`No instance node found for radio component ${inputComponent.name}`);
      }

      const inputNode = findChildNodeWithTypeAndName(instanceNode, 'GROUP', ':: radio');
      if (!inputNode) {
        throw new Error(`No radio node found for radio component ${inputComponent.name}`);
      }

      const labelNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Radio Label');
      if (!labelNode) {
        throw new Error(`No label node found for input component ${inputComponent.name}`);
      }

      const radioNode = findChildNodeWithTypeAndName(inputNode, 'RECTANGLE', 'body');
      if (!radioNode) {
        throw new Error(`No text node found for input component ${inputComponent.name}`);
      }

      const thumbNode = findChildNodeWithTypeAndName(inputNode, 'ELLIPSE', 'on');
      if (!thumbNode) {
        throw new Error(`No thumb node found for input component ${inputComponent.name}`);
      }

      // Description
      const description = inputComponents.metadata[inputComponent.id]?.description ?? '';

      // Background color
      const background = radioNode?.fills.slice();

      // Padding
      const paddingTop = inputNode.paddingTop ?? 0;
      const paddingRight = inputNode.paddingRight ?? 0;
      const paddingBottom = inputNode.paddingBottom ?? 0;
      const paddingLeft = inputNode.paddingLeft ?? 0;

      // Border
      const borderWeight = inputNode.strokeWeight ?? 0;
      const borderRadius = inputNode.cornerRadius ?? 0;
      const borderColor = inputNode.strokes.slice();

      // Opacity
      const opacity = inputNode.opacity ?? 1;

      // Label
      const label: RadioComponentTokens['parts']['label'] = {
        characters: labelNode.characters ?? '',
        fontFamily: labelNode.style.fontFamily,
        fontSize: labelNode.style.fontSize,
        fontWeight: labelNode.style.fontWeight,
        lineHeight: (labelNode.style.lineHeightPercentFontSize ?? 100) / 100,
        letterSpacing: labelNode.style.letterSpacing,
        textAlign: labelNode.style.textAlignHorizontal,
        textDecoration: labelNode.style.textDecoration ?? 'NONE',
        textCase: labelNode.style.textCase ?? 'ORIGINAL',
        color: labelNode.fills[0]?.color ?? { r: 0, g: 0, b: 0, a: 0 },
        opacity: labelNode.opacity ?? 1,
      };

      // Option
      const check: RadioComponentTokens['parts']['check'] = {
        width: radioNode.absoluteBoundingBox.width,
        height: radioNode.absoluteBoundingBox.height,
        background,
        borderWeight,
        borderRadius,
        borderColor,
        paddingLeft: instanceNode.itemSpacing ?? 0,
        effects: [...radioNode.effects],
      };

      const thumb: RadioComponentTokens['parts']['thumb'] = {
        width: thumbNode.absoluteBoundingBox.width ?? 0,
        height: thumbNode.absoluteBoundingBox.height ?? 0,
        background: thumbNode.fills.slice(),
        borderWeight: thumbNode.strokeWeight ?? 0,
        borderColor: thumbNode.strokes.slice(),
      }

      const tokens: Omit<RadioComponentTokens, 'id'> = {
        height: instanceNode.absoluteBoundingBox.height,
        description,
        paddingTop,
        paddingRight,
        paddingBottom,
        paddingLeft,
        opacity,
        parts: {
          label,
          check,
          thumb,
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

      if (!isValidTheme(theme) || !isValidState(state) || !isValidActivity(activity)) {
        return null;
      }

      return {
        id: `design-theme-${theme}-state-${state}-activity-${activity}`,
        componentType: 'design',
        theme,
        state,
        activity,
        ...tokens,
      };
    })
    .filter(filterOutNull);
}
