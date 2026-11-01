'use client';

// The editor and the AI assistant are separate trees under `_app`, so they share state here, not through context.

let draftArgs: Record<string, unknown> | null = null;

export const setCustomPreviewDraft = (args: Record<string, unknown> | null): void => {
  draftArgs = args;
};

export const getCustomPreviewDraft = (): Record<string, unknown> | null => draftArgs;

const CUSTOM_PREVIEW_CHANGED_EVENT = 'handoff:custom-preview-changed';

export interface CustomPreviewChange {
  action: 'created' | 'updated' | 'deleted';
  id: string;
  componentId: string;
}

const ACTION_BY_TOOL: Record<string, CustomPreviewChange['action']> = {
  handoff_create_custom_preview: 'created',
  handoff_update_custom_preview: 'updated',
  handoff_delete_custom_preview: 'deleted',
};

export const customPreviewChangeOf = (toolName: string, output: unknown): CustomPreviewChange | null => {
  const action = ACTION_BY_TOOL[toolName];
  if (!action) return null;
  const block = Array.isArray(output) ? output.find((entry) => entry?.type === 'text') : null;
  if (typeof block?.text !== 'string') return null;
  try {
    const payload = JSON.parse(block.text);
    const record = action === 'deleted' ? payload?.deleted : payload;
    if (typeof record?.id !== 'string' || typeof record?.componentId !== 'string') return null;
    return { action, id: record.id, componentId: record.componentId };
  } catch {
    return null;
  }
};

export const announceCustomPreviewChange = (change: CustomPreviewChange): void => {
  window.dispatchEvent(new CustomEvent<CustomPreviewChange>(CUSTOM_PREVIEW_CHANGED_EVENT, { detail: change }));
};

export const onCustomPreviewChange = (listener: (change: CustomPreviewChange) => void): (() => void) => {
  const handler = (event: Event) => listener((event as CustomEvent<CustomPreviewChange>).detail);
  window.addEventListener(CUSTOM_PREVIEW_CHANGED_EVENT, handler);
  return () => window.removeEventListener(CUSTOM_PREVIEW_CHANGED_EVENT, handler);
};
