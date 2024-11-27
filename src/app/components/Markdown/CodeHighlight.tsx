import oneLight from 'react-syntax-highlighter/dist/cjs/styles/prism/one-light';
import oneDark from 'react-syntax-highlighter/dist/cjs/styles/prism/one-dark';
import html from 'refractor/lang/xml-doc';
import sass from 'refractor/lang/sass';
import scss from 'refractor/lang/scss';
import js from 'refractor/lang/javascript';
import { PreviewObject } from '@handoff/types';
import CopyCode from '../CopyCode';
// @ts-ignore
import highlight from 'react-syntax-highlighter/src/highlight';
import refractor from 'refractor/core';
import { useState } from 'react';
const SyntaxHighlighter = highlight(refractor, {});
SyntaxHighlighter.registerLanguage = (_: string, language: any) => refractor.register(language);
SyntaxHighlighter.registerLanguage('html', html);
SyntaxHighlighter.registerLanguage('js', js);
SyntaxHighlighter.registerLanguage('sass', sass);
SyntaxHighlighter.registerLanguage('scss', scss);

/**
 * Highlight code for preview elements
 * @param param0
 * @returns ReactElement
 */
export const CodeHighlight: React.FC<{
  data: PreviewObject | string | undefined;
  collapsible?: boolean;
  type?: string;
  dark?: boolean;
  title?: string;
  language?: string;
}> = ({ data, collapsible, type, title, dark }) => {
  const [collapsed, setCollapsed] = useState<boolean>(true);

  if (!data) {
    data = { id: '', title: '', description: '', previews: {}, preview: '', code: '' };
  } else if (typeof data === 'string') {
    data = data = { id: '', title: '', description: '', previews: {}, preview: '', code: data };
  }
  if (!type) type = 'html';

  const states = Object.keys(data).filter((key) => ['id', 'preview'].indexOf(key) === -1);
  const [activeState, setActiveState] = useState<string>(states[0]);
  const [code, setCode] = useState<string>(data.code);
  const theme = dark ? oneDark : oneLight;
  theme['pre[class*="language-"]'].overflow = 'auto';
  theme['pre[class*="language-"]'].maxHeight = '450px';
  theme['pre[class*="language-"]'].margin = '0';

  return (
    <div className={`c-code-block${collapsible && collapsed ? ' collapsed' : ''}`}>
      <div className="c-code-block__title" data-language={activeState === 'code' ? type : activeState}>
        {title && <div>{title}</div>}
      </div>

      <SyntaxHighlighter
        style={theme}
        language={activeState === 'code' ? type : activeState}
        PreTag="div"
        showLineNumbers={true}
        wrapLines={false}
        useInlineStyles={true}
      >
        {code}
      </SyntaxHighlighter>

      <CopyCode code={code} />
      {states.length > 2 && (
        <select
          className="c-code-block__select"
          value={activeState}
          onChange={(e) => {
            setActiveState(e.target.value);
            setCode(data[e.target.value]);
          }}
        >
          {states
            .filter((value) => ['code', 'css', 'js', 'sass', 'sharedStyles'].includes(value))
            .map((state) => (
              <option key={state} value={state}>
                {state === 'code'
                  ? 'HTML'
                  : state === 'css'
                  ? 'CSS'
                  : state === 'js'
                  ? 'Javascript'
                  : state === 'sass'
                  ? 'SASS'
                  : state === 'sharedStyles'
                  ? 'Shared CSS'
                  : state}
              </option>
            ))}
        </select>
      )}
      {collapsible && (
        <button className="c-code-block__toggle" onClick={(e) => setCollapsed(!collapsed)}>
          {collapsed ? 'Show more' : 'Show less'}
        </button>
      )}
    </div>
  );
};
