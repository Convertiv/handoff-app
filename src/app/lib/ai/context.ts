import type { UIMessage } from 'ai';

import type { DocsBackend } from '../docs-api/backend';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';
import { pageRefFromPath, type AiPageRef } from './page-ref';

/**
 * The page a question was asked from.
 *
 * The client sends only the route. The server resolves it through the docs backend, so only
 * backend data reaches the model and the raw route never does.
 */

/** One line, bounded, and unable to open or close a tag, so an authored title cannot reshape the prompt. */
const clean = (text: string, max: number): string => {
  const line = text
    .replace(/[\u0000-\u001f\u007f<>]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
};

/**
 * The fields of a question's `<application_context>` block, or `null` when the route gives no
 * context. Identity only: the agent reads the detail with its tools. Patterns have no tool, so their
 * block also carries the description.
 */
const describePage = async (backend: DocsBackend, path: string): Promise<string[] | null> => {
  const ref = pageRefFromPath(path);
  if (!ref) return null;
  try {
    if (ref.kind === 'custom-preview') {
      return await describeCustomPreviewEditor(backend, ref);
    }
    if (ref.kind === 'component') {
      const component = await backend.getComponentDetail(ref.id);
      if (!component) return null;
      return ['page: component', `title: ${clean(component.title || component.id, 50)}`, `id: ${clean(component.id, 50)}`];
    }
    if (ref.kind === 'pattern') {
      const pattern = await backend.getPatternDetail(ref.id);
      if (!pattern) return null;
      return [
        'page: pattern',
        `title: ${clean(pattern.title || pattern.id, 50)}`,
        `id: ${clean(pattern.id, 50)}`,
        ...(pattern.description ? [`description: ${clean(pattern.description, 80)}`] : []),
      ];
    }
    const page = await backend.getPageDetail(ref.id);
    if (!page) return null;
    return ['page: docs page', `title: ${clean(page.title || page.id, 50)}`, `url: ${clean(page.path, 50)}`];
  } catch {
    return null;
  }
};

const describeCustomPreviewEditor = async (backend: DocsBackend, ref: AiPageRef): Promise<string[] | null> => {
  if (getServerRuntimeConfig().mode !== 'registry') return null;
  const component = await backend.getComponentDetail(ref.id);
  if (!component) return null;
  const fields = [
    'page: custom preview editor',
    `component title: ${clean(component.title || component.id, 50)}`,
    `component id: ${clean(component.id, 50)}`,
  ];
  if (!ref.customPreviewId) {
    return [...fields, 'custom preview: not saved yet (save it with handoff_create_custom_preview)'];
  }
  // Lazy, so a workspace never loads the registry database packages.
  const [{ getRegistryConnection }, { getCustomPreview }] = await Promise.all([
    import('../registry-connection'),
    import('../custom-previews/service'),
  ]);
  const { db } = await getRegistryConnection();
  const { preview } = await getCustomPreview(db, backend, ref.customPreviewId);
  return [
    ...fields,
    `custom preview id: ${clean(preview.id, 50)}`,
    `custom preview title: ${clean(preview.title, 50)}`,
    `custom preview status: ${preview.status}`,
  ];
};

const MAX_DRAFT_CHARS = 4000;

/** Escaped so it cannot open or close a tag. A draft that is too long is left out, not cut into invalid JSON. */
const describeDraft = (draft: unknown): string | null => {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return null;
  const json = JSON.stringify(draft).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  return json.length <= MAX_DRAFT_CHARS ? `unsaved args in the editor (JSON): ${json}` : 'unsaved args in the editor: too large to include';
};

const CONTEXT_TAG = /<(\/?)application_context/gi;

/**
 * The conversation as the model reads it: each question starts with an `<application_context>`
 * block for the page it was asked from, taken from its own `metadata.path`. A question with no
 * resolvable page gets no block.
 *
 * The reader's own text has the tag escaped, so every block the model sees is one the site wrote.
 */
export const withPageContext = async (messages: UIMessage[], backend: DocsBackend): Promise<UIMessage[]> => {
  const pages = new Map<string, Promise<string[] | null>>();
  return Promise.all(
    messages.map(async (message) => {
      if (message.role !== 'user') return message;
      const parts = message.parts.map((part) =>
        part.type === 'text' ? { ...part, text: part.text.replace(CONTEXT_TAG, '&lt;$1application_context') } : part
      );
      const path = (message.metadata as { path?: unknown } | undefined)?.path;
      if (typeof path !== 'string') return { ...message, parts };
      if (!pages.has(path)) pages.set(path, describePage(backend, path));
      const fields = await pages.get(path);
      if (!fields) return { ...message, parts };
      const draft = pageRefFromPath(path)?.kind === 'custom-preview' ? describeDraft((message.metadata as { draft?: unknown }).draft) : null;
      const block = ['<application_context>', ...fields, ...(draft ? [draft] : []), '</application_context>'].join('\n');
      return { ...message, parts: [{ type: 'text' as const, text: block }, ...parts] };
    })
  );
};
