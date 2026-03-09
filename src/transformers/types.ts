import { Types as CoreTypes } from 'handoff-core';
import { Plugin } from 'vite';
import { SlotMetadata } from './preview/component';
import { TransformComponentTokensResult } from './preview/types';

/**
 * Module evaluation result
 */
export interface ModuleEvaluationResult {
  exports: any;
}

/**
 * Build configuration for esbuild
 */
export interface BuildConfig {
  entryPoints?: string[];
  stdin?: {
    contents: string;
    resolveDir: string;
    loader: string;
  };
  bundle: boolean;
  write: boolean;
  format: 'cjs' | 'esm';
  platform: 'node' | 'browser';
  jsx: 'automatic' | 'transform' | 'preserve';
  external?: string[];
  sourcemap?: boolean;
  minify?: boolean;
  plugins?: any[];
}

/**
 * Plugin factory function signature
 */
export type PluginFactory = (
  data: TransformComponentTokensResult,
  components: CoreTypes.IDocumentationObject['components'],
  handoff: any
) => Plugin;

/**
 * Schema loading options
 */
export interface SchemaLoadOptions {
  exportKey: 'default' | 'schema';
  handoff: any;
}

/**
 * Preview rendering options
 */
export interface PreviewRenderOptions {
  inspect: boolean;
  injectFieldWrappers: boolean;
}

/**
 * Handlebars template context
 */
export interface HandlebarsContext {
  style: string;
  script: string;
  properties: any;
  fields: { [key: string]: SlotMetadata };
  title: string;
}
