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
export type CheckboxComponents = CheckboxComponent[];

export interface CheckboxComponentTokens {
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
      color: FigmaTypes.Paint[];
      background: FigmaTypes.Paint[];
      // Border
      borderWeight: number;
      borderRadius: number;
      borderColor: FigmaTypes.Paint[];
      // Effects
      effects: FigmaTypes.Effect[];
    };
    icon: {
      width: number;
      height: number;
    },
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
  };
}

export interface CheckboxLayoutComponent extends CheckboxComponentTokens {
  componentType: 'layout';
  /**
   * Component size (lg, md, sm, xs, ...)
   */
  size: string;
}

export interface CheckboxDesignComponent extends CheckboxComponentTokens {
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
   * Component activity (on, off)
   *
   * @default 'light'
   */
  activity: 'on' | 'off';
}
export type CheckboxComponent = CheckboxDesignComponent | CheckboxLayoutComponent;

/**
 * Extract input components
 * @param inputComponents
 * @returns InputComponents
 */
export default function extractCheckboxComponents(inputComponents: GetComponentSetComponentsResult): CheckboxComponents {
  return inputComponents.components
    .map((inputComponent): CheckboxComponent | null => {
      const theme = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Theme') ?? 'light');
      const state = normalizeNamePart(getComponentNamePart(inputComponent.name, 'State') ?? 'default');
      const size = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Size') ?? '');
      const activity = normalizeNamePart(getComponentNamePart(inputComponent.name, 'Activity') ?? '');

      const instanceNode = size ? inputComponent : findChildNodeWithType(inputComponent, 'INSTANCE');
      if (!instanceNode) {
        throw new Error(`No instance node found for checkbox component ${inputComponent.name}`);
      }

      const inputNode = findChildNodeWithTypeAndName(instanceNode, 'GROUP', ':: checkbox');
      if (!inputNode) {
        throw new Error(`No checkbox node found for checkbox component ${inputComponent.name}`);
      }

      const labelNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Checkbox Label');
      if (!labelNode) {
        throw new Error(`No label node found for input component ${inputComponent.name}`);
      }

      const overlayNode = findChildNodeWithTypeAndName(inputNode, 'RECTANGLE', 'Color');
      if (!overlayNode) {
        throw new Error(`No overlay node found for input component ${inputComponent.name}`);
      }

      const checkboxNode = findChildNodeWithTypeAndName(inputNode, 'RECTANGLE', 'body');
      if (!checkboxNode) {
        throw new Error(`No text node found for input component ${inputComponent.name}`);
      }

      const iconNode = findChildNodeWithTypeAndName(inputNode, 'INSTANCE', activity);

      // Description
      const description = inputComponents.metadata[inputComponent.id]?.description ?? '';

      // Background color
      const background = checkboxNode?.fills.slice();

      // Padding
      const paddingTop = inputNode.paddingTop ?? 0;
      const paddingRight = inputNode.paddingRight ?? 0;
      const paddingBottom = inputNode.paddingBottom ?? 0;
      const paddingLeft = inputNode.paddingLeft ?? 0;

      // Opacity
      const opacity = inputNode.opacity ?? 1;

      // Border
      const borderWeight = checkboxNode.strokeWeight ?? 0;
      const borderRadius = checkboxNode.cornerRadius ?? 0;
      const borderColor = checkboxNode.strokes.slice();

      // Label
      const label: CheckboxComponentTokens['parts']['label'] = {
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
      const check: CheckboxComponentTokens['parts']['check'] = {
        width: checkboxNode.absoluteBoundingBox.width,
        height: checkboxNode.absoluteBoundingBox.height,
        color: overlayNode?.fills.slice(),
        background,
        borderWeight,
        borderRadius,
        borderColor,
        paddingLeft: instanceNode.itemSpacing ?? 0,
        effects: [...checkboxNode.effects],
      };

      const icon: CheckboxComponentTokens['parts']['icon'] = {
        width: iconNode ? iconNode.absoluteBoundingBox.width : 0,
        height: iconNode ? iconNode.absoluteBoundingBox.height : 0,
      }

      const tokens: Omit<CheckboxComponentTokens, 'id'> = {
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
          icon,
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
