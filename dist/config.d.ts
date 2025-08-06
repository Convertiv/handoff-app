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
 * Retrieves the client configuration from the provided handoff configuration.
 *
 * @param handoff - The handoff object containing the configuration details.
 * @returns The client configuration object.
 */
export declare const getClientConfig: (handoff: Handoff) => ClientConfig;
