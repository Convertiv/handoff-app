import { Config } from './types/config';
import 'dotenv/config';
import webpack from 'webpack';
import { DocumentationObject } from './types';
import { CssTransformerOutput } from './transformers/css/index';
import { TransformedPreviewComponents } from './transformers/preview/index';
import { HookReturn } from './types';
import { HandoffIntegration } from './transformers/integration';
declare global {
    var handoff: Handoff | null;
}
declare class Handoff {
    config: Config | null;
    debug: boolean;
    force: boolean;
    modulePath: string;
    workingPath: string;
    integrationHooks: HandoffIntegration;
    hooks: {
        init: (config: Config) => Config;
        fetch: () => void;
        build: (documentationObject: DocumentationObject) => void;
        integration: (documentationObject: DocumentationObject, data: HookReturn[]) => HookReturn[];
        typeTransformer: (documentationObject: DocumentationObject, types: CssTransformerOutput) => CssTransformerOutput;
        cssTransformer: (documentationObject: DocumentationObject, css: CssTransformerOutput) => CssTransformerOutput;
        scssTransformer: (documentationObject: DocumentationObject, scss: CssTransformerOutput) => CssTransformerOutput;
        webpack: (webpackConfig: webpack.Configuration) => webpack.Configuration;
        preview: (documentationObject: DocumentationObject, preview: TransformedPreviewComponents) => TransformedPreviewComponents;
        configureExportables: (exportables: string[]) => string[];
    };
    constructor(config?: Config);
    init(configOverride?: Config): Handoff;
    preRunner(): Handoff;
    fetch(): Promise<Handoff>;
    integration(): Promise<Handoff>;
    build(): Promise<Handoff>;
    ejectConfig(): Promise<Handoff>;
    ejectIntegration(): Promise<Handoff>;
    ejectExportables(): Promise<Handoff>;
    ejectPages(): Promise<Handoff>;
    makeExportable(type: string, name: string): Promise<Handoff>;
    start(): Promise<Handoff>;
    dev(): Promise<Handoff>;
    postInit(callback: (config: Config) => Config): void;
    postTypeTransformer(callback: (documentationObject: DocumentationObject, types: CssTransformerOutput) => CssTransformerOutput): void;
    postCssTransformer(callback: (documentationObject: DocumentationObject, types: CssTransformerOutput) => CssTransformerOutput): void;
    postScssTransformer(callback: (documentationObject: DocumentationObject, types: CssTransformerOutput) => CssTransformerOutput): void;
    postPreview(callback: (documentationObject: DocumentationObject, previews: TransformedPreviewComponents) => TransformedPreviewComponents): void;
    postBuild(callback: (documentationObject: DocumentationObject) => void): void;
    postIntegration(callback: (documentationObject: DocumentationObject, data: HookReturn[]) => HookReturn[]): void;
    modifyWebpackConfig(callback: (webpackConfig: webpack.Configuration) => webpack.Configuration): void;
    configureExportables(callback: (exportables: string[]) => string[]): void;
}
export default Handoff;
