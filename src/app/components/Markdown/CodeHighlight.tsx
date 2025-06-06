import { PreviewObject } from '@handoff/types';
import oneDark from 'react-syntax-highlighter/dist/cjs/styles/prism/one-dark';
import oneLight from 'react-syntax-highlighter/dist/cjs/styles/prism/one-light';
import js from 'refractor/lang/javascript';
import json from 'refractor/lang/json';
import sass from 'refractor/lang/sass';
import scss from 'refractor/lang/scss';
import html from 'refractor/lang/xml-doc';
// @ts-ignore
import { CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { Select } from '@radix-ui/react-select';
import Handlebars from 'handlebars';
import { useEffect, useState } from 'react';
import highlight from 'react-syntax-highlighter/src/highlight';
import refractor from 'refractor/core';
import CopyCode from '../CopyCode';
import { Button } from '../ui/button';
import { Collapsible } from '../ui/collapsible';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
const SyntaxHighlighter = highlight(refractor, {});
SyntaxHighlighter.registerLanguage = (_: string, language: any) => refractor.register(language);
SyntaxHighlighter.registerLanguage('html', html);
SyntaxHighlighter.registerLanguage('js', js);
SyntaxHighlighter.registerLanguage('json', json);
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
          'code',
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
  const [activeState, setActiveState] = useState<string>(states[0]);
  const [code, setCode] = useState<string>(data.html);
  const theme = dark ? oneDark : oneLight;
  theme['pre[class*="language-"]'].overflow = 'auto';
  theme['pre[class*="language-"]'].maxHeight = height ?? '450px';
  theme['pre[class*="language-"]'].margin = '0';

  useEffect(() => {
    Handlebars.registerHelper('eq', (a, b) => a === b);
  }, [data]);

  useEffect(() => {
    // check if data is a string
    if (typeof data === 'string') {
      setCode(data);
      return;
    }

    // check if data is an object with an html key
    if ('html' in data && !!data.html) {
      setCode(data.html);
      return;
    }

    if ('code' in data && !!data.code) {
      setCode(Handlebars.compile(data.code)({ properties: currentValues }));
      return;
    }
  }, [currentValues, data]);

  return (
    <Collapsible className="mt-4 space-y-2" style={{ maxWidth: '71vw' }} open={isOpen} onOpenChange={setIsOpen}>
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
                } else if (key === 'html') {
                  if ('html' in data && !!data.html) {
                    setCode(data.html);
                  } else {
                    setCode(Handlebars.compile(data.code)({ properties: currentValues }));
                  }
                } else {
                  setCode(data[key]);
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Breakpoint" />
              </SelectTrigger>
              <SelectContent>
                {states
                  .filter((value) => ['html', 'css', 'js', 'sass', 'sharedStyles'].includes(value))
                  .map((state) => (
                    <SelectItem key={state} value={state}>
                      {state === 'html'
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
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}

          <CopyCode code={code} />
        </div>
      </div>

      <SyntaxHighlighter
        style={theme}
        language={activeState === 'html' ? type : activeState}
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
