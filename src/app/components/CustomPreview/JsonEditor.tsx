'use client';

import * as React from 'react';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

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

// A copy, because the code samples mutate the shared theme's `pre`/`code` styles.
const tokenTheme: typeof oneLight = Object.fromEntries(
  Object.entries(oneLight).map(([selector, style]) =>
    selector.includes('pre[class*="language-"]') || selector.includes('code[class*="language-"]')
      ? [
          selector,
          { ...(style as React.CSSProperties), background: 'transparent', margin: 0, padding: 0, overflow: 'visible', ...TEXT_METRICS },
        ]
      : [selector, style]
  )
);

export const JsonEditor: React.FC<{
  id?: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  minLines?: number;
  footer?: React.ReactNode;
}> = ({ id, value, onChange, readOnly, minLines = 16, footer }) => {
  const highlightRef = React.useRef<HTMLDivElement>(null);
  const gutterRef = React.useRef<HTMLDivElement>(null);
  const lineCount = Math.max(value.split('\n').length, minLines);

  const syncScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = event.currentTarget;
    if (highlightRef.current) highlightRef.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
    if (gutterRef.current) gutterRef.current.style.transform = `translateY(${-scrollTop}px)`;
  };

  return (
    <div className="overflow-hidden rounded-b-lg border border-t-0 border-gray-200 bg-[#fafafa] dark:border-gray-900">
      <div className="flex">
        <div
          className="shrink-0 overflow-hidden border-r border-gray-200 bg-[#fafafa] text-right text-[#9d9d9f] select-none dark:border-gray-900"
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
            <SyntaxHighlighter language="json" style={tokenTheme} PreTag="div" CodeTag="div" useInlineStyles>
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
              caretColor: '#383a42',
              background: 'transparent',
            }}
            className="relative block w-full resize-none overflow-auto outline-none selection:bg-blue-200/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          />
        </div>
      </div>
      {footer}
    </div>
  );
};
