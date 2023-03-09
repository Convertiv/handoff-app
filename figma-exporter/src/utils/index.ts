
/**
 * Generate slug from string
 * @param str
 * @returns
 */
export const slugify = (str: string): string =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '-')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');


/**
 * Filters out null values
 */
export const filterOutNull = <T>(value: T): value is NonNullable<T> => value !== null;

export const filterOutUndefined = <T>(value: T): value is NonNullable<T> => value !== undefined;

export interface ComponentSizeMap {
  figma: string;
  css: string;
}
export const componentSizeMap: ComponentSizeMap[] = [
  {
    figma:'small',
    css: 'sm',
  },
  {
    figma:'medium',
    css: 'md',
  },
  {
    figma:'large',
    css: 'lg',
  },
];

export const mapComponentSize = (figma: string): string => {
  let size = componentSizeMap.find((size) => size.figma === figma);

  return size?.css ?? 'sm';
}
