import { SlotMetadata } from './component';

export enum ComponentType {
  Element = 'element',
  Block = 'block',
  Navigation = 'navigation',
  Utility = 'utility',
}

export type ComponentListObject = {
  id: string;
  version: string;
  image: string;
  title: string;
  type: string;
  group: string;
  categories: string[];
  tags: string[];
  description: string;
  properties: { [key: string]: SlotMetadata };
  versions: string[];
  previews: { [key: string]: OptionalPreviewRender };
  paths: string[];
};

export type TransformComponentTokensResult = {
  id: string;
  type?: ComponentType;
  image?: string;
  group?: string;
  categories?: string[];
  tags?: string[];
  should_do?: string[];
  should_not_do?: string[];
  code: string;
  html?: string;
  preview: string;
  js?: string;
  css?: string;
  sass?: string;
  sharedStyles?: string;
  title?: string;
  description?: string;
  previews?: { [key: string]: OptionalPreviewRender };
  properties?: { [key: string]: SlotMetadata };
} | null;

export type OptionalPreviewRender = {
  title: string;
  values: { [key: string]: string | string[] };
  url: string;
};
export interface TransformedPreviewComponents {
  [key: string]: TransformComponentTokensResult[];
}
