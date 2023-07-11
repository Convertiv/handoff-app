
import { Config } from './types/config';
import 'dotenv/config';
import webpack from 'webpack';
import { DocumentationObject } from './types';
import { TransformerOutput } from './transformers/types';
import { TransformedPreviewComponents } from './transformers/preview/types';

declare module 'handoff-app';

declare class Handoff {
    config: Config;
    modulePath: string;
    workingPath: string;
    force: boolean;
    debug: boolean;
    hooks: {
        init: (config: Config) => Config;
        fetch: () => void;
        build: (documentationObject: DocumentationObject) => void;
        integration: (documentationObject: DocumentationObject) => void;
        typeTransformer: (documentationObject: DocumentationObject, types: TransformerOutput) => TransformerOutput;
        cssTransformer: (documentationObject: DocumentationObject, css: TransformerOutput) => TransformerOutput;
        scssTransformer: (documentationObject: DocumentationObject, scss: TransformerOutput) => TransformerOutput;
        styleDictionaryTransformer: (documentationObject: DocumentationObject, styleDictionary: TransformerOutput) => TransformerOutput;
        webpack: (webpackConfig: webpack.Configuration) => webpack.Configuration;
        preview: (documentationObject: DocumentationObject, preview: TransformedPreviewComponents) => TransformedPreviewComponents;
        configureExportables: (exportables: string[]) => string[];
    };
}