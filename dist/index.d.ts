import 'dotenv/config';
import { Types as CoreTypes, Handoff as HandoffRunner } from 'handoff-core';
import { Config, IntegrationObject } from './types/config';
declare class Handoff {
    config: Config | null;
    debug: boolean;
    force: boolean;
    modulePath: string;
    workingPath: string;
    exportsDirectory: string;
    sitesDirectory: string;
    integrationObject?: IntegrationObject | null;
    designMap: {
        colors: {};
        effects: {};
        typography: {};
    };
    private _initialArgs;
    private _configFilePaths;
    private _documentationObjectCache?;
    private _sharedStylesCache?;
    private _handoffRunner?;
    constructor(debug?: boolean, force?: boolean, config?: Partial<Config>);
    private construct;
    init(configOverride?: Partial<Config>): Handoff;
    reload(): Handoff;
    preRunner(validate?: boolean): Handoff;
    fetch(): Promise<Handoff>;
    component(name: string | null): Promise<Handoff>;
    build(): Promise<Handoff>;
    ejectConfig(): Promise<Handoff>;
    ejectExportables(): Promise<Handoff>;
    ejectPages(): Promise<Handoff>;
    ejectTheme(): Promise<Handoff>;
    makeExportable(type: string, name: string): Promise<Handoff>;
    makeTemplate(component: string, state: string): Promise<Handoff>;
    makePage(name: string, parent: string): Promise<Handoff>;
    makeComponent(name: string): Promise<Handoff>;
    makeIntegrationStyles(): Promise<Handoff>;
    start(): Promise<Handoff>;
    dev(): Promise<Handoff>;
    validateComponents(): Promise<Handoff>;
    /**
     * Retrieves the documentation object, using cached version if available
     * @returns {Promise<CoreTypes.IDocumentationObject | undefined>} The documentation object or undefined if not found
     */
    getDocumentationObject(): Promise<CoreTypes.IDocumentationObject | undefined>;
    /**
     * Retrieves shared styles, using cached version if available
     * @returns {Promise<string | null>} The shared styles string or null if not found
     */
    getSharedStyles(): Promise<string | null>;
    getRunner(): Promise<ReturnType<typeof HandoffRunner>>;
    /**
     * Returns configured legacy component definitions in array form.
     * @deprecated Will be removed before 1.0.0 release.
     */
    getLegacyDefinitions(): Promise<CoreTypes.ILegacyComponentDefinition[] | null>;
    /**
     * Gets the project ID, falling back to filesystem-safe working path if figma_project_id is missing
     * @returns {string} The project ID to use for path construction
     */
    getProjectId(): string;
    /**
     * Gets the output path for the current project
     * @returns {string} The absolute path to the output directory
     */
    getOutputPath(): string;
    /**
     * Gets the path to the tokens.json file
     * @returns {string} The absolute path to the tokens.json file
     */
    getTokensFilePath(): string;
    /**
     * Gets the path to the preview.json file
     * @returns {string} The absolute path to the preview.json file
     */
    getPreviewFilePath(): string;
    /**
     * Gets the path to the changelog.json file
     * @returns {string} The absolute path to the changelog.json file
     */
    getChangelogFilePath(): string;
    /**
     * Gets the path to the tokens directory
     * @returns {string} The absolute path to the tokens directory
     */
    getVariablesFilePath(): string;
    /**
     * Gets the path to the icons.zip file
     * @returns {string} The absolute path to the icons.zip file
     */
    getIconsZipFilePath(): string;
    /**
     * Gets the path to the logos.zip file
     * @returns {string} The absolute path to the logos.zip file
     */
    getLogosZipFilePath(): string;
    /**
     * Gets the list of config file paths
     * @returns {string[]} Array of absolute paths to config files
     */
    getConfigFilePaths(): string[];
    /**
     * Clears all cached data
     * @returns {void}
     */
    clearCaches(): void;
    /**
     * Reads and parses a JSON file
     * @param {string} path - Path to the JSON file
     * @returns {Promise<any>} The parsed JSON content or undefined if file cannot be read
     */
    private readJsonFile;
}
export declare const initIntegrationObject: (handoff: Handoff) => [integrationObject: IntegrationObject, configs: string[]];
export type { ComponentObject as Component } from './transformers/preview/types';
export type { Config } from './types/config';
export { Transformers as CoreTransformers, TransformerUtils as CoreTransformerUtils, Types as CoreTypes } from 'handoff-core';
export default Handoff;
