import { HOME_PAGE_ID } from '@handoff/registry/content-kinds';

/**
 * Kept free of server imports: the AI assistant resolves page context in the browser through this
 * helper, so importing it must not pull the docs backend into the client bundle.
 */

/** Accept internal page routes without URL normalization hiding traversal segments. */
export const pageIdFromUrl = (url: string): string | null => {
  if (!url.startsWith('/') || url.startsWith('//') || /[?#\\\u0000-\u001f\u007f]/.test(url)) {
    return null;
  }
  if (url === '/') return HOME_PAGE_ID;
  const id = url.slice(1).replace(/\/$/, '');
  for (const segment of id.split('/')) {
    try {
      const decoded = decodeURIComponent(segment);
      if (!decoded || decoded === '.' || decoded === '..' || /[/\\\u0000-\u001f\u007f]/.test(decoded)) return null;
    } catch {
      return null;
    }
  }
  return id;
};
