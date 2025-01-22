import { PreviewObject } from '@handoff/types';
import oneDark from 'react-syntax-highlighter/dist/cjs/styles/prism/one-dark';
import oneLight from 'react-syntax-highlighter/dist/cjs/styles/prism/one-light';
import js from 'refractor/lang/javascript';
import sass from 'refractor/lang/sass';
import scss from 'refractor/lang/scss';
import html from 'refractor/lang/xml-doc';
// @ts-ignore
import { CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { Select } from '@radix-ui/react-select';
import { ChevronsDown } from 'lucide-react';
import { useState } from 'react';
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
  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (!data) {
    data = { id: '', title: '', description: '', previews: {}, preview: '', code: '' };
  } else if (typeof data === 'string') {
    data = data = { id: '', title: '', description: '', previews: {}, preview: '', code: data };
  }
  if (!type) type = 'html';

  const states = Object.keys(data)
    .filter((key) => ['id', 'preview', 'title', 'description', 'type', 'group', 'tags', 'previews', 'properties'].indexOf(key) === -1)
    .map((key) => key);
  const [activeState, setActiveState] = useState<string>(states[0]);
  const [code, setCode] = useState<string>(data.code);
  const theme = dark ? oneDark : oneLight;
  theme['pre[class*="language-"]'].overflow = 'auto';
  theme['pre[class*="language-"]'].maxHeight = '450px';
  theme['pre[class*="language-"]'].margin = '0';

  return (
    <Collapsible className="space-y-2" style={{ maxWidth: '71vw' }} open={isOpen} onOpenChange={setIsOpen}>
      <div
        className="mt-5 flex items-center justify-between rounded-t-sm bg-gray-100 px-5 py-3"
        data-language={activeState === 'code' ? type : activeState}
      >
        {title && <div>{title}</div>}
        {states.length > 2 && (
          <Select
            defaultValue={activeState}
            onValueChange={(key) => {
              setActiveState(key);
              setCode(data[key]);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Breakpoint" />
            </SelectTrigger>
            <SelectContent>
              {states
                .filter((value) => ['code', 'css', 'js', 'sass', 'sharedStyles'].includes(value))
                .map((state) => (
                  <SelectItem key={state} value={state}>
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
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
        <CopyCode code={code} />
      </div>

      <SyntaxHighlighter
        style={theme}
        language={activeState === 'code' ? type : activeState}
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
            <ChevronsDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      )}
    </Collapsible>
  );
};
