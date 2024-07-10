import oneLight from 'react-syntax-highlighter/dist/cjs/styles/prism/one-light';
import html from 'refractor/lang/xml-doc';
import sass from 'refractor/lang/sass';
import { PreviewObject } from '@handoff/types';
import CopyCode from '../CopyCode';
// @ts-ignore
import highlight from 'react-syntax-highlighter/src/highlight';
import refractor from 'refractor/core';
import { useState } from 'react';
const SyntaxHighlighter = highlight(refractor, {});
SyntaxHighlighter.registerLanguage = (_: string, language: any) => refractor.register(language);
SyntaxHighlighter.registerLanguage('html', html);
SyntaxHighlighter.registerLanguage('sass', sass);

/**
 * Highlight code for preview elements
 * @param param0
 * @returns ReactElement
 */
export const CodeHighlight: React.FC<{ data: PreviewObject | undefined; collapsible?: boolean }> = ({ data, collapsible }) => {
  const [collapsed, setCollapsed] = useState<boolean>(true);

  if (data) {
    const states = Object.keys(data).filter((key) => ['id', 'preview'].indexOf(key) === -1);
    const [activeState, setActiveState] = useState<string>(states[0]);
    const [code, setCode] = useState<string>(data.code);
    oneLight['pre[class*="language-"]'].overflow = 'auto';
    oneLight['pre[class*="language-"]'].maxHeight = '450px';
    return (
      <div className={`c-code-block${collapsible && collapsed ? ' collapsed' : ''}`}>
        <SyntaxHighlighter
          style={oneLight}
          language={activeState === 'code' ? 'html' : activeState}
          PreTag="div"
          showLineNumbers={true}
          wrapLines={true}
          useInlineStyles={true}
        >
          {code}
        </SyntaxHighlighter>
        <CopyCode code={data.code} />
        <select
          className="c-code-block__select"
          value={activeState}
          onChange={(e) => {
            setActiveState(e.target.value);
            setCode(data[e.target.value]);
          }}
        >
          {states.map((state) => (
            <option key={state} value={state}>
              {state === 'code' ? 'HTML' : state === 'css' ? 'CSS' : state === 'js' ? 'Javascript' : state === 'sass' ? 'SASS' : state}
            </option>
          ))}
        </select>
        {collapsible && (
          <button className="c-code-block__toggle" onClick={(e) => setCollapsed(!collapsed)}>
            {collapsed ? 'Show more' : 'Show less'}
          </button>
        )}
      </div>
    );
  } else {
    return <></>;
  }
};
