import type { CSSProperties } from 'react';

/**
 * What a code window does with a line too long to fit it.
 *
 * - `scroll` — the line keeps its shape and the window scrolls sideways. Right for a token dump
 *   or a stylesheet, where a wrapped line is a different line and column alignment carries meaning.
 * - `wrap` — the line folds inside the window and the window never grows. Right for a dialog, which
 *   is already as wide as it is going to get and has nowhere to put a horizontal scrollbar.
 */
export type CodeWindowOverflow = 'scroll' | 'wrap';

/**
 * The shared look of a highlighted code window, spread first into each call site's `customStyle`.
 *
 * It goes on the outer block rather than in `codeTagProps` so the theme's `padding: 1em` and the
 * line numbers scale with the text. It is an inline style rather than a stylesheet rule because
 * some Prism themes declare their own inline `fontSize`, which a stylesheet cannot beat; ours
 * (`code-theme.ts`) declares none, so without this the size is inherited from the surrounding page.
 */
export const codeWindowStyle: CSSProperties = {
  fontSize: '14px',
};

/**
 * `codeTagProps` for `react-syntax-highlighter` that actually apply the long-line behaviour.
 *
 * `wrapLongLines` alone fails silently. The library sets `whiteSpace: 'pre-wrap'` on the code tag,
 * then spreads the theme's `code[class*="language-"]` block over it, and that block declares
 * `whiteSpace: 'pre'`. Passing `codeTagProps` explicitly puts this declaration last.
 *
 * `wrap` needs `overflow-wrap: anywhere`: `pre-wrap` only breaks at existing wrap opportunities, so a
 * long URL or attribute value with no spaces still overflows. `anywhere` also drops the element's
 * min-content width to zero, so the container does not grow to fit the line.
 */
export function codeTagPropsFor(
  theme: Record<string, CSSProperties> | undefined,
  language: string,
  overflow: CodeWindowOverflow
): { className: string; style: CSSProperties } {
  const base: CSSProperties = {
    ...(theme?.['code[class*="language-"]'] ?? {}),
    ...(theme?.[`code[class*="language-${language}"]`] ?? {}),
  };
  return {
    className: `language-${language}`,
    style:
      overflow === 'wrap'
        ? { ...base, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }
        : { ...base, whiteSpace: 'pre' },
  };
}
