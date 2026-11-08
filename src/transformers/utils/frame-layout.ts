// No imports: the docs app loads this module in the browser.

/** `page` keeps the project's own page background. */
export type FrameBackground = 'page' | 'transparent';

const FRAME_BACKGROUND_HASH_PREFIX = '#handoff-background=';

/**
 * Only elements get this layout. Under `place-items: center`, a child with `width: auto` shrinks to its
 * content, so a full-width block would shrink too.
 *
 * The minimum height is fixed, not `100%`. The docs app sizes the frame from `body.scrollHeight`, so a
 * body as tall as the frame could never shrink after a taller preview. 100px is the stage's initial
 * frame height.
 */
const CENTERING_CSS = 'body{margin:0;min-height:100px;display:grid;place-items:center}';

/**
 * The flag is in the URL fragment, so the docs app switches it without reloading the frame, and a
 * sandboxed frame needs no message channel. Other fragments, such as an anchor in the preview, keep
 * the current value.
 */
const TRANSPARENT_CSS =
  'html[data-handoff-background=transparent],html[data-handoff-background=transparent] body{background:transparent!important}';

const BACKGROUND_SCRIPT = `(function(){var p=${JSON.stringify(FRAME_BACKGROUND_HASH_PREFIX)};function a(){var h=location.hash;if(h.indexOf(p)===0)document.documentElement.setAttribute('data-handoff-background',h.slice(p.length))}a();addEventListener('hashchange',a)})();`;

const ELEMENT_FRAME_HEAD = `<style data-handoff-frame-layout="center">${CENTERING_CSS}${TRANSPARENT_CSS}</style><script>${BACKGROUND_SCRIPT}</script>`;

export const isElementType = (type: string | undefined): boolean => (type || 'element') === 'element';

/** Last in `<head>`, so it overrides earlier `body` rules on the properties it sets. */
const injectElementFrameHead = (html: string): string =>
  html.includes('</head>') ? html.replace('</head>', `${ELEMENT_FRAME_HEAD}</head>`) : ELEMENT_FRAME_HEAD + html;

export const frameDocumentFor = (type: string | undefined, html: string): string =>
  isElementType(type) ? injectElementFrameHead(html) : html;

/** Changes only the fragment, so switching does not reload the frame. */
export const frameUrlWithBackground = (src: string, background: FrameBackground): string =>
  `${src.split('#')[0]}${FRAME_BACKGROUND_HASH_PREFIX}${background}`;
