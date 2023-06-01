import type { Config } from './figma-exporter/src/config';
import type { PluginTransformer } from './figma-exporter/src/transformers/plugin';
export type HandoffConfig = Config;
declare const config: Config;
export type Config = Config;
export type Plugin = PluginTransformer;
export default config;
