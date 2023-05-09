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
 * Parse the config file
 * @param configPath
 * @returns
 */
export declare const evaluateConfig: (configPath: string) => any;
/**
 * Map a component size to the right name
 * @param figma
 * @returns
 */
export declare const mapComponentSize: (figma: string, component?: string) => string;
