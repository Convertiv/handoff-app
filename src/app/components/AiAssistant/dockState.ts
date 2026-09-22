/** The shape of the docked assistant, kept per reader in `localStorage` the way the side nav is. */

/** Wide enough for one 32px control with even padding. */
export const RAIL_WIDTH = 52;
export const MIN_WIDTH = 320;
export const MAX_WIDTH = 720;
export const DEFAULT_WIDTH = 420;

/** Below this the assistant overlays the page instead of docking. Matches `useIsMobile`. */
export const DOCK_BREAKPOINT = 768;

/** Drives both the panel's width and the page's inset, so the two can never disagree. */
export const DOCK_WIDTH_VAR = '--ai-dock-width';

const STORAGE_KEY = 'handoff:ai:dock';

export interface DockState {
  open: boolean;
  /** Open, but collapsed to the rail. */
  minified: boolean;
  width: number;
}

export const DEFAULT_DOCK: DockState = { open: false, minified: false, width: DEFAULT_WIDTH };

const MAX_VIEWPORT_SHARE = 0.5;

export const clampWidth = (width: number): number => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(width)));

/**
 * Caps the width against this viewport. A width kept from a large screen is otherwise most of a
 * small one, and the expanded component preview is left with a strip to render into.
 */
export const fitWidth = (width: number): number =>
  Math.min(clampWidth(width), Math.max(MIN_WIDTH, Math.round(window.innerWidth * MAX_VIEWPORT_SHARE)));

export const dockWidth = (state: DockState): number => (!state.open ? 0 : state.minified ? RAIL_WIDTH : clampWidth(state.width));

export const readDock = (): DockState => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!stored || typeof stored !== 'object') return DEFAULT_DOCK;
    return {
      open: Boolean(stored.open),
      minified: Boolean(stored.minified),
      width: fitWidth(Number(stored.width) || DEFAULT_WIDTH),
    };
  } catch {
    return DEFAULT_DOCK;
  }
};

export const writeDock = (state: DockState): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* empty */
  }
};

/**
 * Reserves the dock's column before the first paint.
 *
 * React reads the stored state only after hydration, so without this the page paints full width and
 * then reflows. `next-themes` avoids its theme flash the same way.
 */
export const dockWidthScript = `(function(){try{
var s=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||'null');
if(!s||!s.open||window.innerWidth<${DOCK_BREAKPOINT})return;
var w=s.minified?${RAIL_WIDTH}:Math.min(${MAX_WIDTH},Math.max(${MIN_WIDTH},Math.round(s.width)||${DEFAULT_WIDTH}),Math.max(${MIN_WIDTH},Math.round(window.innerWidth*${MAX_VIEWPORT_SHARE})));
document.documentElement.style.setProperty(${JSON.stringify(DOCK_WIDTH_VAR)},w+'px');
}catch(e){}})();`;
