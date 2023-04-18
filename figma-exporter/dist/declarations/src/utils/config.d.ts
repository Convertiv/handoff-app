export interface ComponentSizeMap {
    figma: string;
    css: string;
}
/**
 * Get Config
 * @returns Config
 */
export declare const getFetchConfig: () => any;
/**
 * Map a component size to the right name
 * @param figma
 * @returns
 */
export declare const mapComponentSize: (figma: string, component?: string, config?: any) => string;
