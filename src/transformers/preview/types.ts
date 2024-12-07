import { SlotMetadata } from './snippets';

export type TransformComponentTokensResult = {
  id: string;
  code: string;
  preview: string;
  js?: string;
  css?: string;
  sass?: string;
  sharedStyles?: string;
  title?: string;
  description?: string;
  previews?: OptionalPreviewRender[];
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
