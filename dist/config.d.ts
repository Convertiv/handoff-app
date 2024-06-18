export interface ImageStyle {
    name: string;
    style: string;
    height: number;
    width: number;
    description: string;
}
export declare const defaultConfig: () => Config;
/**
 * Get the configuration formatted for the client, either from the root of the project or from the default config.
 * @returns Promise<Config>
 */
export declare const getClientConfig: (configOverride?: any) => ClientConfig;
