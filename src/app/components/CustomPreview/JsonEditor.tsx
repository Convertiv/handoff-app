'use client';

import { useTheme } from 'next-themes';
import * as React from 'react';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';

import { githubDark, githubLight } from '../../lib/code-theme';
import { codeWindowSurface } from '../../lib/code-window';

SyntaxHighlighter.registerLanguage('json', json);

// Both layers share these metrics. Any difference shifts the caret off the colored text.
const TEXT_METRICS: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  fontSize: '12px',
  lineHeight: '20px',
  tabSize: 2,
  whiteSpace: 'pre',
  letterSpacing: 0,
};

const PADDING_Y = 12;
const PADDING_X = 12;

const tokenTheme = (theme: typeof githubLight): typeof githubLight =>
  Object.fromEntries(
    Object.entries(theme).map(([selector, style]) =>
      selector.includes('pre[class*="language-"]') || selector.includes('code[class*="language-"]')
        ? [selector, { ...style, background: 'transparent', margin: 0, padding: 0, overflow: 'visible', ...TEXT_METRICS }]
        : [selector, style]
    )
  );

const THEMES = {
  light: { tokens: tokenTheme(githubLight), caret: githubLight['code[class*="language-"]'].color, ...codeWindowSurface.light },
  dark: { tokens: tokenTheme(githubDark), caret: githubDark['code[class*="language-"]'].color, ...codeWindowSurface.dark },
};

export const JsonEditor: React.FC<{
  id?: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  minLines?: number;
  footer?: React.ReactNode;
}> = ({ id, value, onChange, readOnly, minLines = 16, footer }) => {
  const { resolvedTheme } = useTheme();
  const theme = THEMES[resolvedTheme === 'dark' ? 'dark' : 'light'];
  const highlightRef = React.useRef<HTMLDivElement>(null);
  const gutterRef = React.useRef<HTMLDivElement>(null);
  const lineCount = Math.max(value.split('\n').length, minLines);

  const syncScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = event.currentTarget;
    if (highlightRef.current) highlightRef.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
    if (gutterRef.current) gutterRef.current.style.transform = `translateY(${-scrollTop}px)`;
  };

  return (
    <div
      className="overflow-hidden rounded-b-lg border border-t-0 border-gray-200 dark:border-gray-900"
      style={{ background: theme.background }}
    >
      <div className="flex">
        <div
          className="shrink-0 overflow-hidden border-r border-gray-200 text-right select-none dark:border-gray-900"
          style={{ color: theme.lineNumber }}
          aria-hidden
        >
          <div ref={gutterRef} style={{ ...TEXT_METRICS, padding: `${PADDING_Y}px 10px` }}>
            {Array.from({ length: lineCount }, (_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div
            ref={highlightRef}
            className="pointer-events-none absolute top-0 left-0"
            style={{ padding: `${PADDING_Y}px ${PADDING_X}px` }}
            aria-hidden
          >
            <SyntaxHighlighter language="json" style={theme.tokens} PreTag="div" CodeTag="div" useInlineStyles>
              {/* A trailing newline would otherwise collapse, and the last line would lose its height. */}
              {`${value}\n`}
            </SyntaxHighlighter>
          </div>
          <textarea
            id={id}
            value={value}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap="off"
            onChange={(event) => onChange(event.target.value)}
            onScroll={syncScroll}
            style={{
              ...TEXT_METRICS,
              padding: `${PADDING_Y}px ${PADDING_X}px`,
              height: lineCount * 20 + PADDING_Y * 2,
              color: 'transparent',
              caretColor: theme.caret,
              background: 'transparent',
            }}
            className="relative block w-full resize-none overflow-auto outline-none selection:bg-blue-200/70 dark:selection:bg-blue-500/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          />
        </div>
      </div>
      {footer}
    </div>
  );
};
