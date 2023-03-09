import { uniqBy } from 'lodash';
import { GetComponentSetComponentsResult } from '..';
import * as FigmaTypes from '../../../figma/types';
import { filterOutNull } from '../../../utils';
import { findChildNodeWithType, findChildNodeWithTypeAndName, getComponentNamePart, isValidTheme, normalizeNamePart } from '../utils';

export type SwitchComponents = SwitchComponent[];

export interface SwitchComponentTokens {
  id: string;

  // Description
  description: string;

  // Spacing
  spacing: number;

  // Size
  width: number;
  height: number;

  // Background
  background: FigmaTypes.Paint[];

  // Border
  borderWeight: number;
  borderRadius: number;
  borderColor: FigmaTypes.Paint[];

  // Opacity
  opacity: number;

  // Effects
  effects: FigmaTypes.Effect[];

  parts: {
    // Label
    label: {
      fontFamily: string;
      fontSize: number;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: number;
      textAlign: FigmaTypes.TypeStyle['textAlignHorizontal'];
      textDecoration: FigmaTypes.TypeStyle['textDecoration'];
      textCase: FigmaTypes.TypeStyle['textCase'];
      color: FigmaTypes.Paint[];
      opacity: number;
    };

    // Thumb
    thumb: {
      background: FigmaTypes.Paint[];
      borderWeight: number;
      borderColor: FigmaTypes.Paint[];
      width: number;
      height: number;
    };
  };
}

export interface SwitchDesignComponent extends SwitchComponentTokens {
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
  /**
   * Component activity (on, off)
   *
   * @default 'light'
   */
  activity: 'on' | 'off';
}

export interface SwitchLayoutComponent extends SwitchComponentTokens {
  componentType: 'layout';
  /**
   * Component size (xl, lg, md, sm, xs)
   */
  size: string;
}

export type SwitchComponent = SwitchDesignComponent | SwitchLayoutComponent;

const isValidState = (state: string): state is SwitchDesignComponent['state'] => {
  return ['default', 'hover', 'disabled', 'error'].includes(state);
};

const isValidActivity = (activity: string): activity is 'on' | 'off' => {
  return ['on', 'off'].includes(activity);
};

export default function extractSwitchComponents(switchComponents: GetComponentSetComponentsResult): SwitchComponents {
  return uniqBy(
    switchComponents.components
      .map((switchComponent): SwitchComponent | null => {
        const theme = normalizeNamePart(getComponentNamePart(switchComponent.name, 'Theme') ?? 'light');
        const state = normalizeNamePart(getComponentNamePart(switchComponent.name, 'State') ?? 'default');
        const size = normalizeNamePart(getComponentNamePart(switchComponent.name, 'Size') ?? '');
        const activity = normalizeNamePart(getComponentNamePart(switchComponent.name, 'Activity') ?? 'off');

        const instanceNode = size ? switchComponent : findChildNodeWithType(switchComponent, 'INSTANCE');
        if (!instanceNode) {
          throw new Error(`No instance node found for switch component ${switchComponent.name}`);
        }

        const switchNode = findChildNodeWithTypeAndName(instanceNode, 'GROUP', ':: switch');
        if (!switchNode) {
          throw new Error(`No switch node found for switch component ${switchComponent.name}`);
        }

        const bodyNode = findChildNodeWithTypeAndName(switchNode, 'RECTANGLE', 'body');
        if (!bodyNode) {
          throw new Error(`No body node found for switch component ${switchComponent.name}`);
        }

        const thumbNode = findChildNodeWithTypeAndName(switchNode, 'ELLIPSE', activity);
        if (!thumbNode) {
          throw new Error(`No thumb node found for switch component ${switchComponent.name}`);
        }

        const labelNode = findChildNodeWithTypeAndName(instanceNode, 'TEXT', 'Switch Label');
        if (!labelNode) {
          throw new Error(`No label node found for switch component ${switchComponent.name}`);
        }

        // Description
      const description = switchComponents.metadata[switchComponent.id]?.description ?? '';

        // Spacing
        const spacing = instanceNode.itemSpacing ?? 0;

        // Width and height
        const width = bodyNode.absoluteBoundingBox.width;
        const height = bodyNode.absoluteBoundingBox.height;

        // Background color
        const background = bodyNode.fills.slice();

        // Border
        const borderWeight = bodyNode.strokeWeight ?? 0;
        const borderRadius = bodyNode.cornerRadius ?? 0;
        const borderColor = bodyNode.strokes.slice();

        // Opacity
        const opacity = switchNode.opacity ?? 1;

        // Effects
        const effects = [...bodyNode.effects];

        // Thumb
        const thumb = {
          background: thumbNode.fills.slice(),
          borderWeight: thumbNode.strokeWeight ?? 0,
          borderColor: thumbNode.strokes.slice(),
          width: thumbNode.absoluteBoundingBox.width,
          height: thumbNode.absoluteBoundingBox.height,
        };

        // Label
        const label = {
          fontFamily: labelNode.style.fontFamily,
          fontSize: labelNode.style.fontSize,
          fontWeight: labelNode.style.fontWeight,
          lineHeight: (labelNode.style.lineHeightPercentFontSize ?? 100) / 100,
          letterSpacing: labelNode.style.letterSpacing,
          textAlign: labelNode.style.textAlignHorizontal,
          textDecoration: labelNode.style.textDecoration ?? 'NONE',
          textCase: labelNode.style.textCase ?? 'ORIGINAL',
          color: labelNode.fills.slice(),
          opacity: labelNode.opacity ?? 1,
        };

        const tokens: Omit<SwitchComponentTokens, 'id'> = {
          description,
          spacing,
          width,
          height,
          background,
          borderWeight,
          borderRadius,
          borderColor,
          opacity,
          effects,
          parts: {
            label,
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
      .filter(filterOutNull),
    'id'
  );
}
