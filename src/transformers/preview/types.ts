export type TransformComponentTokensResult = { id: string; preview: string; code: string; js?: string; css?: string } | null;

export interface TransformedPreviewComponents {
  [key: string]: TransformComponentTokensResult[];
}
