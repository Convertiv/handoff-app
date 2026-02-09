import { PreviewObject } from '@handoff/types';
// @ts-ignore
import { CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { Select } from '@radix-ui/react-select';
import Handlebars from 'handlebars';
import { useEffect, useState } from 'react';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import sass from 'react-syntax-highlighter/dist/esm/languages/prism/scss';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import html from 'react-syntax-highlighter/dist/esm/languages/prism/xml-doc';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyCode from '../CopyCode';
import { Button } from '../ui/button';
import { Collapsible } from '../ui/collapsible';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Register all supported languages
SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('js', js);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('sass', sass);
SyntaxHighlighter.registerLanguage('scss', sass);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('html', html);
SyntaxHighlighter.registerLanguage('xml', html);
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
  height?: string;
  currentValues?: Record<string, string>;
}> = ({ data, collapsible, type, title, dark, height, currentValues }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (!data) {
    data = {
      id: '',
      image: '',
      tags: [],
      categories: [],
      figma: '',
      title: '',
      description: '',
      should_do: [],
      should_not_do: [],
      previews: {},
      preview: '',
      html: '',
      code: '',
      format: 'html',
    };
  } else if (typeof data === 'string') {
    data = data = {
      id: '',
      title: '',
      categories: [],
      figma: '',
      tags: [],
      image: '',
      description: '',
      previews: {},
      should_do: [],
      should_not_do: [],
      preview: '',
      html: data,
      code: data,
      format: 'html',
    };
  }
  if (!type) type = 'html';

  const states = Object.keys(data)
    .filter(
      (key) =>
        [
          'id',
          'preview',
          'image',
          'categories',
          'title',
          'format',
          'description',
          'type',
          'group',
          'tags',
          'previews',
          'properties',
          'should_do',
          'should_not_do',
          'figma',
        ].indexOf(key) === -1
    )
    .map((key) => key);
  console.log(states);
  const [activeState, setActiveState] = useState<string>(states[0]);
  const [code, setCode] = useState<string>(data.html);
  const theme = dark ? oneDark : oneLight;
  theme['pre[class*="language-"]'].overflow = 'auto';
  theme['pre[class*="language-"]'].maxHeight = height ?? '450px';
  theme['pre[class*="language-"]'].margin = '0';

  useEffect(() => {
    Handlebars.registerHelper('eq', (a, b) => a === b);
    Handlebars.registerHelper('field', (_, options) => options.fn(this));
  });

  const labels: Record<string, string> = {
    code: 'Code',
    html: 'HTML',
    css: 'CSS',
    js: 'JavaScript',
    javascript: 'JavaScript',
    jsx: 'JSX',
    tsx: 'TSX',
    typescript: 'TypeScript',
    ts: 'TypeScript',
    sass: 'SASS',
    scss: 'SCSS',
    sharedStyles: 'Shared CSS',
    json: 'JSON',
    markdown: 'Markdown',
  };

  const getLabel = (state: string): string => {
    if (state === 'code' && typeof data === 'object') {
      const format = data.format?.toLowerCase();
      if (format === 'react' || format === 'tsx') return 'React (TSX)';
      if (format === 'jsx') return 'React (JSX)';
      if (format === 'typescript' || format === 'ts') return 'TypeScript';
      if (format === 'javascript' || format === 'js') return 'JavaScript';
    }
    return labels[state] || state.charAt(0).toUpperCase() + state.slice(1);
  };

  /**
   * Determines the appropriate syntax highlighting language based on the active state and data format
   */
  const language = (activeState: string): string => {
    if (typeof data !== 'object') {
      return activeState === 'html' ? type : activeState;
    }

    // Handle React/JSX/TSX code format
    if ('code' in data && !!data.code && activeState === 'code') {
      const format = data.format?.toLowerCase();
      if (format === 'react' || format === 'tsx') return 'tsx';
      if (format === 'jsx') return 'jsx';
      if (format === 'typescript' || format === 'ts') return 'typescript';
      if (format === 'javascript' || format === 'js') return 'javascript';
    }

    // Handle JavaScript state
    if (activeState === 'js') {
      // Check if the JS code contains JSX syntax (common patterns)
      const jsCode = 'js' in data ? data.js : '';
      if (typeof jsCode === 'string' && hasJsxSyntax(jsCode)) {
        return 'jsx';
      }
      return 'javascript';
    }

    // Map common state names to language identifiers
    const languageMap: Record<string, string> = {
      html: type || 'html',
      css: 'css',
      sass: 'scss',
      sharedStyles: 'css',
      json: 'json',
    };

    return languageMap[activeState] || activeState;
  };

  /**
   * Detects if code contains JSX syntax patterns
   */
  const hasJsxSyntax = (code: string): boolean => {
    // Look for common JSX patterns:
    // - Self-closing tags with attributes: <Component prop="value" />
    // - Opening tags with attributes: <Component prop="value">
    // - Fragment syntax: <> or </>
    // - JSX expressions: {expression}
    const jsxPatterns = [
      /<[A-Z][a-zA-Z0-9]*\s*[^>]*\/>/,  // Self-closing component tags
      /<[A-Z][a-zA-Z0-9]*\s*[^>]*>/,    // Opening component tags
      /<\/[A-Z][a-zA-Z0-9]*>/,          // Closing component tags
      /<>\s*|<\/>/,                      // Fragment syntax
      /className\s*=/,                   // className attribute (React-specific)
      /\{[^}]+\}/,                       // JSX expressions (basic check)
    ];
    return jsxPatterns.some(pattern => pattern.test(code));
  };

  useEffect(() => {
    // check if data is a string
    if (typeof data === 'string') {
      setCode(data);
      return;
    }

    if ('code' in data && !!data.code && data.format === 'handlebars') {
      setCode(Handlebars.compile(data.code)({ properties: currentValues }));
      return;
    } else if ('code' in data && !!data.code && data.format === 'react') {
      setCode(data.code);
      return;
    }

    // check if data is an object with an html key
    if ('html' in data && !!data.html) {
      setCode(data.html);
      return;
    }
  }, [currentValues, data]);

  return (
    <Collapsible id="code-samples" className="mt-4 space-y-2" style={{ maxWidth: '71vw' }} open={isOpen} onOpenChange={setIsOpen}>
      <div
        className="flex w-full items-center justify-between rounded-t-lg bg-gray-50 px-6 py-2 pr-3 align-middle dark:bg-gray-800"
        data-language={activeState === 'html' ? type : activeState}
      >
        {title && <div>{title}</div>}
        <div className="flex items-center gap-2">
          {states.length > 2 && (
            <Select
              defaultValue={activeState}
              onValueChange={(key) => {
                setActiveState(key);
                if (typeof data === 'string') {
                  setCode(data);
                  return;
                } else {
                  setCode(data[key]);
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Code View" />
              </SelectTrigger>
              <SelectContent>
                {states
                  .filter((value) => ['code', 'html', 'css', 'js', 'sass', 'sharedStyles'].includes(value))
                  .map((state) => {
                    return (
                      <SelectItem key={state} value={state}>
                        {getLabel(state)}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          )}

          <CopyCode code={code} />
        </div>
      </div>

      <SyntaxHighlighter
        style={theme}
        language={language(activeState)}
        PreTag="div"
        showLineNumbers={true}
        wrapLines={true}
        wrapLongLines={true}
        useInlineStyles={true}
      >
        {code}
      </SyntaxHighlighter>

      {collapsible && (
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      )}
    </Collapsible>
  );
};
