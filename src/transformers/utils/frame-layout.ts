// Type imports only: the docs app loads this module in the browser.
import type { ComponentType } from '../preview/types';

/**
 * Only elements get this layout. Under `place-items: center`, a child with `width: auto` shrinks to its
 * content, so a full-width block would shrink too.
 *
 * The padding keeps the specimen off the frame edges. It is on the frame, not the element, so a block that
 * contains the element does not inherit it.
 *
 * The minimum height is fixed, not `100%`. The docs app sizes the frame from `body.scrollHeight`, so a
 * body as tall as the frame could never shrink after a taller preview. 100px is the stage's initial
 * frame height.
 */
const CENTERING_CSS = 'body{margin:0;box-sizing:border-box;min-height:100px;padding:32px;display:grid;place-items:center}';

const ELEMENT_FRAME_HEAD = `<style data-handoff-frame-layout="center">${CENTERING_CSS}</style>`;

const ELEMENT_TYPE: `${ComponentType.Element}` = 'element';

export const isElementType = (type: string | undefined): boolean => (type || ELEMENT_TYPE) === ELEMENT_TYPE;

/** Last in `<head>`, so it overrides earlier `body` rules on the properties it sets. */
const injectElementFrameHead = (html: string): string =>
  html.includes('</head>') ? html.replace('</head>', `${ELEMENT_FRAME_HEAD}</head>`) : ELEMENT_FRAME_HEAD + html;

export const frameDocumentFor = (type: string | undefined, html: string): string =>
  isElementType(type) ? injectElementFrameHead(html) : html;

