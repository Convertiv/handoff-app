import { useTheme } from 'next-themes';
import React, { ReactElement } from 'react';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import handlebars from 'react-syntax-highlighter/dist/esm/languages/prism/handlebars';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import sass from 'react-syntax-highlighter/dist/esm/languages/prism/scss';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import html from 'react-syntax-highlighter/dist/esm/languages/prism/xml-doc';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyCode from '../CopyCode';

import {
  Braces,
  Code,
  FileCode2,
  FileText,
  FileType,
  Terminal,
} from 'lucide-react';

SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('zsh', bash);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('handlebars', handlebars);
SyntaxHighlighter.registerLanguage('hbs', handlebars);
SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('js', js);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('md', markdown);
SyntaxHighlighter.registerLanguage('sass', sass);
SyntaxHighlighter.registerLanguage('scss', sass);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('html', html);
SyntaxHighlighter.registerLanguage('xml', html);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('yml', yaml);

export type CustomRenderers = {
  code: (props: any) => ReactElement;
  pre: (props: any) => ReactElement;
  h1: (props: any) => ReactElement;
  h2: (props: any) => ReactElement;
  h3: (props: any) => ReactElement;
  h4: (props: any) => ReactElement;
  h5: (props: any) => ReactElement;
  h6: (props: any) => ReactElement;
  paragraph: (props: { children: React.ReactNode }) => ReactElement;
};

function extractText(node: any): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node?.props?.children) return extractText(node.props.children);
  return '';
}

const Headings = (element: any) => {
  const { children, node } = element;
  if (children[0]) {
    const type = node.tagName || 'h6';

    let anchor = extractText(children).toLowerCase();
    anchor = anchor.replace(/[^a-zA-Z0-9 ]/g, '');
    anchor = anchor.replace(/ /g, '-');

    const container = (children: React.ReactNode): React.ReactNode => (
      <>
        {children}
        <a id={anchor} href={`#${anchor}`} className="doc-link"></a>
      </>
    );

    switch (type) {
      case 'h1':
        return <h1 className="text-2xl font-bold">{container(children)}</h1>;
      case 'h2':
        return <h2 className="text-xl font-bold">{container(children)}</h2>;
      case 'h3':
        return <h3 className="text-lg font-bold">{container(children)}</h3>;
      case 'h4':
        return <h4 className="text-base font-bold">{container(children)}</h4>;
      case 'h5':
        return <h5 className="text-sm font-bold">{container(children)}</h5>;
      case 'h6':
        return <h6 className="text-xs font-bold">{container(children)}</h6>;
      default:
        return <h6 className="text-xs font-bold">{container(children)}</h6>;
    }
  } else {
    return <h1>children</h1>;
  }
};

const LANGUAGE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  bash: Terminal,
  sh: Terminal,
  shell: Terminal,
  zsh: Terminal,
  js: FileCode2,
  javascript: FileCode2,
  ts: FileCode2,
  typescript: FileCode2,
  jsx: FileCode2,
  tsx: FileCode2,
  css: FileType,
  scss: FileType,
  sass: FileType,
  html: FileCode2,
  xml: FileCode2,
  json: Braces,
  yaml: FileText,
  yml: FileText,
  markdown: FileText,
  md: FileText,
  handlebars: Code,
  hbs: Code,
};

const LANGUAGE_LABELS: Record<string, string> = {
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  zsh: 'Zsh',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'SASS',
  html: 'HTML',
  xml: 'XML',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  markdown: 'Markdown',
  md: 'Markdown',
  handlebars: 'Handlebars',
  hbs: 'Handlebars',
  text: 'Code',
};

function parseMeta(meta: string | undefined): Record<string, string> {
  if (!meta) return {};
  const result: Record<string, string> = {};
  const regex = /(\w+)="([^"]+)"/g;
  let match;
  while ((match = regex.exec(meta)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

function MarkdownCodeBlock(props: any) {
  const { className, children, node, 'data-meta': dataMeta, ...rest } = props;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const langMatch = /language-(\w+)/.exec(className || '');
  const isBlock = String(children).includes('\n');

  if (!langMatch && !isBlock) {
    return <code className={className} {...rest}>{children}</code>;
  }

  const lang = langMatch ? langMatch[1] : 'text';
  const meta = parseMeta(dataMeta);
  const filename = meta.filename;
  const codeString = String(children).replace(/\n$/, '');
  const IconComponent = LANGUAGE_ICONS[lang] || Code;
  const langLabel = LANGUAGE_LABELS[lang] || lang;

  const theme = isDark ? { ...oneDark } : { ...oneLight };
  theme['pre[class*="language-"]'] = {
    ...theme['pre[class*="language-"]'],
    overflow: 'auto',
    margin: '0',
    borderRadius: '0 0 0.5rem 0.5rem',
    background: isDark ? '#1e1e1e' : '#fafafa',
  };

  return (
    <div className="not-prose my-4 min-w-0 max-w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <IconComponent className="h-4 w-4" />
          <span>{filename || langLabel}</span>
        </div>
        <CopyCode code={codeString} />
      </div>
      <SyntaxHighlighter
        style={theme}
        language={lang}
        PreTag="div"
        showLineNumbers={lang !== 'text'}
        wrapLines={true}
        useInlineStyles={true}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
}

/**
 * Remark plugin that preserves the code fence meta string
 * (the text after the language identifier) as a hast data attribute.
 */
export function remarkCodeMeta() {
  return (tree: any) => {
    const walk = (node: any) => {
      if (node.type === 'code' && node.meta) {
        node.data = node.data || {};
        node.data.hProperties = node.data.hProperties || {};
        node.data.hProperties['data-meta'] = node.meta;
      }
      if (node.children) {
        node.children.forEach(walk);
      }
    };
    walk(tree);
  };
}

export const MarkdownComponents: CustomRenderers = {
  h1: Headings,
  h2: Headings,
  h3: Headings,
  h4: Headings,
  h5: Headings,
  h6: Headings,
  paragraph: ({ children }) => <p>{children}</p>,
  pre: ({ children }) => <>{children}</>,
  code: MarkdownCodeBlock,
};

export default Headings;
