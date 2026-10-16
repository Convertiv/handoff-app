import type { UIMessage } from 'ai';

import type { DocsBackend } from '../docs-api/backend';
import { pageIdFromUrl } from '../mcp/page-url';

/**
 * The page a question was asked from.
 *
 * The client sends only the route. The server resolves it through the docs backend, so only
 * backend data reaches the model and the raw route never does.
 */

export type AiPageKind = 'component' | 'pattern' | 'page';

export interface AiPageRef {
  kind: AiPageKind;
  id: string;
}

/** Token and foundation routes map to token sets, not pages, so they give no context yet. */
const UNSUPPORTED = /^(system\/tokens|foundations)(\/|$)/;

/** The entity a route shows, or `null` for a route that gives no context. Pure, so the client uses it too. */
export const pageRefFromPath = (path: string): AiPageRef | null => {
  const id = pageIdFromUrl(path);
  if (id === null || UNSUPPORTED.test(id)) return null;
  const entity = /^system\/(component|pattern)\/([^/]+)$/.exec(id);
  if (entity) return { kind: entity[1] as AiPageKind, id: decodeURIComponent(entity[2]) };
  return { kind: 'page', id };
};

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
      const block = ['<application_context>', ...fields, '</application_context>'].join('\n');
      return { ...message, parts: [{ type: 'text' as const, text: block }, ...parts] };
    })
  );
};
