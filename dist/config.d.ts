import Handoff from '.';
import { Config } from './types/config';
export interface ImageStyle {
    name: string;
    style: string;
    height: number;
    width: number;
    description: string;
}
export declare const defaultConfig: () => Config;
/**
 * Get the config, either from the root of the project or from the default config
 * @returns Promise<Config>
 */
export declare const getConfig: (configOverride?: any) => Config;
/**
 * Get the handoff from the global scope
 * @returns Handoff
 */
export declare const getHandoff: () => Handoff;
/**
 * Serialize the handoff to the working directory
 */
export declare const serializeHandoff: (handoff: Handoff) => void;
/**
 * Deserialize the handoff from the working directory
 * @returns
 */
export declare const deserializeHandoff: () => any;
