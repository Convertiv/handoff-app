// A custom preview holds only the component id and complete args, so a republish cannot break it.

export type CustomPreviewArgs = Record<string, unknown>;

export type CustomPreviewIssueCode = 'unknown-property' | 'missing-required' | 'type-mismatch';

export interface CustomPreviewIssue {
  code: CustomPreviewIssueCode;
  path: string;
  message: string;
}

/** `unsupported`: the published component has no client render shell. */
export type CustomPreviewStatus = 'ok' | 'needs-attention' | 'unsupported';

export interface CustomPreviewAssessment {
  status: CustomPreviewStatus;
  issues: CustomPreviewIssue[];
  /** Stored args plus defaults for missing required props. Never stored. */
  renderArgs: CustomPreviewArgs;
}

export interface CustomPreview {
  id: string;
  componentId: string;
  title: string;
  description?: string;
  args: CustomPreviewArgs;
  status: CustomPreviewStatus;
  issues: CustomPreviewIssue[];
  contractChanged: boolean;
  createdBy: { id: string; name?: string } | null;
  updatedBy: { id: string; name?: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const MAX_ARGS_BYTES = 64 * 1024;
export const MAX_TITLE_LENGTH = 120;
export const MAX_DESCRIPTION_LENGTH = 500;
