import type { IsScreenChrome } from '@handoff/screens/client-api';

/** Marks a region the docs app draws inside a screen, such as the assistant column. */
export const SCREEN_CHROME_ATTRIBUTE = 'data-screen-chrome';

/**
 * Overlays render in portals outside the screen, so they are matched by role. The Radix popper
 * wrapper covers popovers and tooltips, whose content has no role of its own.
 */
const SCREEN_CHROME_SELECTOR = [
  `[${SCREEN_CHROME_ATTRIBUTE}]`,
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[role="menu"]',
  '[role="listbox"]',
  '[data-radix-popper-content-wrapper]',
].join(', ');

export const isScreenChrome: IsScreenChrome = (target) => target instanceof Element && target.closest(SCREEN_CHROME_SELECTOR) !== null;
