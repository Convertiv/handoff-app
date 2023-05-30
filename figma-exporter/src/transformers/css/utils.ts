import { filterOutUndefined } from '../../utils';

export interface AbstractComponent {
  componentType?: string;
  /**
   * Component theme (light, dark)
   */
  theme?: string;
  /**
   * Component type (primary, secondary, tertiary, etc.)
   */
  type?: string;
  /**
   * Component state (default, hover, disabled)
   */
  state?: string;
  /**
   * Component size (lg, md, sm, xs, ...)
   */
  size?: string;
  layout?: string;
}

export const getTypesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components
    .map((component) => component.type)
    .filter(filterOutUndefined)));
};

export const getStatesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components
    .map((component) => component.state)
    .filter(filterOutUndefined)));
};

export const getThemesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components
    .map((component) => component.theme)
    .filter(filterOutUndefined)));
};

export const getSizesFromComponents = (components: AbstractComponent[]): string[] => {
  return Array.from(new Set(components
    .map((component) => component.size)
    .filter(filterOutUndefined)));
};
