import { pageIdFromUrl } from '../mcp/page-url';

// The browser imports this module, so it must not import server code.

export type AiPageKind = 'component' | 'pattern' | 'page' | 'custom-preview' | 'screen';

export interface AiPageRef {
  kind: AiPageKind;
  /** For a custom preview, its component's id. For a screen, the screen id. */
  id: string;
  /** `null` for a custom preview not saved yet. */
  customPreviewId?: string | null;
}

/** Token and foundation routes map to token sets, not pages, so they give no context yet. */
const UNSUPPORTED = /^(system\/tokens|foundations)(\/|$)/;

export const pageRefFromPath = (path: string): AiPageRef | null => {
  const id = pageIdFromUrl(path);
  if (id === null || UNSUPPORTED.test(id)) return null;
  const editor = /^system\/component\/([^/]+)\/previews\/([^/]+)$/.exec(id);
  if (editor) {
    const customPreviewId = decodeURIComponent(editor[2]);
    return { kind: 'custom-preview', id: decodeURIComponent(editor[1]), customPreviewId: customPreviewId === 'new' ? null : customPreviewId };
  }
  // A screen's own path segments are its state, not separate pages, so every route of a screen is one context.
  const screen = /^screens\/([^/]+)(\/|$)/.exec(id);
  if (screen) return { kind: 'screen', id: decodeURIComponent(screen[1]) };
  const entity = /^system\/(component|pattern)\/([^/]+)$/.exec(id);
  if (entity) return { kind: entity[1] as AiPageKind, id: decodeURIComponent(entity[2]) };
  return { kind: 'page', id };
};
