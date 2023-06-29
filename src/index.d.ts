
import { Config } from './types/config';
import 'dotenv/config';
import webpack from 'webpack';
import { DocumentationObject } from './types';
import { CssTransformerOutput } from './transformers/css/index';
import { TransformedPreviewComponents } from './transformers/preview/index';

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
        typeTransformer: (documentationObject: DocumentationObject, types: CssTransformerOutput) => CssTransformerOutput;
        cssTransformer: (documentationObject: DocumentationObject, css: CssTransformerOutput) => CssTransformerOutput;
        scssTransformer: (documentationObject: DocumentationObject, scss: CssTransformerOutput) => CssTransformerOutput;
        webpack: (webpackConfig: webpack.Configuration) => webpack.Configuration;
        preview: (documentationObject: DocumentationObject, preview: TransformedPreviewComponents) => TransformedPreviewComponents;
        configureExportables: (exportables: string[]) => string[];
    };
}