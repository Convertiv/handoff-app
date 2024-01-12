import Handoff from '.';
import { ClientConfig, Config } from './types/config';
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
/**
 * Serializes and saves the current handoff state to the working directory
 * @param handoff Handoff
 */
export declare const saveHandoffState: (handoff: Handoff) => void;
