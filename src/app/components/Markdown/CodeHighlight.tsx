import type { RendererKind } from '@handoff/catalog/renderers';
import { PreviewObject } from '@handoff/types/preview';
import { Select } from '@radix-ui/react-select';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import handlebars from 'react-syntax-highlighter/dist/esm/languages/prism/handlebars';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import sass from 'react-syntax-highlighter/dist/esm/languages/prism/scss';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import html from 'react-syntax-highlighter/dist/esm/languages/prism/xml-doc';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import { githubDark, githubLight } from '../../lib/code-theme';
import { codeTagPropsFor, codeWindowStyle } from '../../lib/code-window';
import CopyCode from '../CopyCode';
import { Button } from '../ui/button';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

/** Lines a collapsed sample shows under its "View Code" button. */
const COLLAPSED_LINES = 3;

/**
 * The code window's background and line-number colours, modelled on the shadcn docs' code blocks.
 * They replace the theme's background; token colours still come from the theme. Dark mode uses the
 * site's gray scale.
 */
const SURFACE = {
  light: { background: '#f8f8f8', lineNumber: '#737373' },
  dark: { background: '#111827', lineNumber: '#9ca3af' },
};
const LINE_HEIGHT = 'calc(1.75em + 2px)';

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
SyntaxHighlighter.registerLanguage('handlebars', handlebars);
SyntaxHighlighter.registerLanguage('hbs', handlebars);

type CodeFormat = { label: string; language: string };

/**
 * How each renderer's implementation code is shown. Exhaustive over `RendererKind`, so a new
 * renderer fails to compile until its label and highlighting are declared. `RENDERER_PLUGINS`
 * puts the same guard on preview support.
 */
const CODE_FORMATS: Record<RendererKind, CodeFormat> = {
  react: { label: 'React (TSX)', language: 'tsx' },
  handlebars: { label: 'Handlebars', language: 'handlebars' },
};

/**
 * Formats that are not a renderer name: the synthetic `html` that the string and empty-data
 * branches set, and the language names that older artifacts carry in `format`.
 */
const FORMAT_ALIASES: Record<string, CodeFormat> = {
  html: { label: 'HTML', language: 'html' },
  tsx: CODE_FORMATS.react,
  jsx: { label: 'React (JSX)', language: 'jsx' },
  ts: { label: 'TypeScript', language: 'typescript' },
  typescript: { label: 'TypeScript', language: 'typescript' },
  js: { label: 'JavaScript', language: 'javascript' },
  javascript: { label: 'JavaScript', language: 'javascript' },
};

const formatFor = (format?: string): CodeFormat => {
  const key = format?.toLowerCase() ?? '';
  // Legacy default: an unrecognized format reads as plain code and highlights as Handlebars.
  return CODE_FORMATS[key as RendererKind] ?? FORMAT_ALIASES[key] ?? { label: 'Code', language: 'handlebars' };
};

type CodeView = { label?: string; language?: string };

/**
 * The code views, in the order they are offered. An allowlist rather than a denylist of metadata:
 * a field added to the record later cannot become a view by default. An absent `label` or
 * `language` is computed: from the item's format for `code`, from the `type` prop for `html`, and
 * by JSX detection for `js`.
 */
const CODE_VIEWS: Record<string, CodeView> = {
  usage: { label: 'Usage', language: 'tsx' },
  code: {},
  html: { label: 'HTML' },
  css: { label: 'CSS', language: 'css' },
  js: { label: 'JavaScript' },
  sass: { label: 'SASS', language: 'scss' },
  sharedStyles: { label: 'Shared CSS', language: 'css' },
};

/** `usage` is derived from the previews, not read off the record, so it is offered separately. */
const RECORD_VIEWS = Object.keys(CODE_VIEWS).filter((key) => key !== 'usage');

/**
 * Highlight code for preview elements.
 *
 * `collapsible` starts it closed: the first {@link COLLAPSED_LINES} lines under a fade, with a
 * "View Code" button over them. Opening it shows the whole sample, scrolling past `height`, with the
 * format dropdown and the copy button in its top-right corner. A short sample starts closed too,
 * because opening is also what reveals the other formats.
 *
 * `attached` drops its own border and corners, for when it sits inside the preview card above it.
 *
 * It follows the site's light/dark theme; `dark` forces one or the other.
 */
export const CodeHighlight: React.FC<{
  data: PreviewObject | string | undefined;
  collapsible?: boolean;
  attached?: boolean;
  type?: string;
  dark?: boolean;
  language?: string;
  height?: string;
  currentPreviewUrl?: string;
}> = ({ data, collapsible, attached, type, dark, height, currentPreviewUrl }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const { resolvedTheme } = useTheme();
  const isDark = dark ?? resolvedTheme === 'dark';

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
    data = {
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

  const states = RECORD_VIEWS.filter((key) => !!(data as Record<string, any>)[key]);
  const hasPerPreviewUsage =
    typeof data === 'object' &&
    !!data.previews &&
    Object.values(data.previews).some((preview) => !!preview?.usage);
  const hasUsageState = (typeof data === 'object' && !!data.usage) || hasPerPreviewUsage;
  const selectableStates = hasUsageState && !states.includes('usage') ? ['usage', ...states] : states;
  const preferredState = selectableStates.includes('usage') ? 'usage' : selectableStates[0];
  const [activeState, setActiveState] = useState<string>(preferredState);
  const [code, setCode] = useState<string>(data.html);
  const stateResetKey = useMemo(() => {
    if (typeof data === 'string') {
      return `string:${type || 'html'}`;
    }
    return `${data.id || ''}|${data.title || ''}|${data.format || ''}|${Object.keys(data.previews || {}).join('|')}`;
  }, [data, type]);
  // Read, never written: the theme object is shared with every other highlighter in the app, so the
  // per-window overrides go in `customStyle` / `codeTagProps` below.
  const theme = isDark ? githubDark : githubLight;
  const surface = isDark ? SURFACE.dark : SURFACE.light;

  const getLabel = (state: string): string => {
    if (state === 'code' && typeof data === 'object') {
      return formatFor(data.format).label;
    }
    return CODE_VIEWS[state]?.label ?? state.charAt(0).toUpperCase() + state.slice(1);
  };

  /**
   * Determines the appropriate syntax highlighting language based on the active state and data format
   */
  const language = (activeState: string): string => {
    if (typeof data !== 'object') {
      return activeState === 'html' ? type : activeState;
    }

    if (activeState === 'code') {
      return formatFor(data.format).language;
    }

    // The `type` prop names the markup language of the rendered preview.
    if (activeState === 'html') {
      return type || 'html';
    }

    // A component's compiled JS can be plain JavaScript or still hold JSX.
    if (activeState === 'js') {
      const jsCode = 'js' in data ? data.js : '';
      return typeof jsCode === 'string' && hasJsxSyntax(jsCode) ? 'jsx' : 'javascript';
    }

    return CODE_VIEWS[activeState]?.language ?? activeState;
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

  const resolveUsageCode = (): string => {
    if (typeof data !== 'object') {
      return '';
    }

    if (currentPreviewUrl && data.previews) {
      const activePreview = Object.values(data.previews).find((preview) => preview.url === currentPreviewUrl);
      if (activePreview?.usage) {
        return activePreview.usage;
      }
    }

    const firstPreviewWithUsage = data.previews ? Object.values(data.previews).find((preview) => !!preview.usage) : undefined;
    if (firstPreviewWithUsage?.usage) {
      return firstPreviewWithUsage.usage;
    }

    return data.usage || '';
  };

  // Always default to usage for newly viewed component/code payloads.
  // Users can still manually switch tabs after this initial selection.
  // A different component closes the sample again.
  useEffect(() => {
    setActiveState(preferredState);
    setExpanded(false);
  }, [preferredState, stateResetKey]);

  useEffect(() => {
    if (typeof data === 'string') {
      setCode(data);
      return;
    }

    if (activeState === 'usage') {
      setCode(resolveUsageCode());
      return;
    }

    if (activeState === 'code' && 'code' in data && !!data.code) {
      setCode(data.code);
      return;
    }

    if (activeState in data && !!(data as Record<string, any>)[activeState]) {
      setCode((data as Record<string, any>)[activeState]);
    }
  }, [activeState, currentPreviewUrl, data]);

  const source = typeof code === 'string' ? code : '';
  const lines = source.replace(/\s+$/, '').split('\n');
  const showAll = expanded || !collapsible;
  const lang = language(activeState);
  const codeTag = codeTagPropsFor(theme, lang, 'scroll');
  // Line numbers carry the `comment` class, and the library spreads stylesheet entries over
  // `lineNumberStyle`, so their colour has to come from a `linenumber` entry, on a local copy.
  const highlighterStyle = { ...theme, linenumber: { color: surface.lineNumber } };

  return (
    <div
      id="code-samples"
      data-language={activeState === 'html' ? type : activeState}
      className={
        attached
          ? 'relative w-full min-w-0'
          : 'relative mt-4 w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-900'
      }
      style={attached ? undefined : { maxWidth: '71vw' }}
    >
      {showAll && (
        <div className="absolute right-4 top-3 z-10 flex items-center gap-1.5 rounded-md" style={{ background: surface.background }}>
          {selectableStates.length > 1 && (
            <Select
              value={activeState}
              onValueChange={(key) => {
                setActiveState(key);
                if (typeof data === 'string') {
                  setCode(data);
                  return;
                } else if (key === 'usage') {
                  setCode(resolveUsageCode());
                  return;
                } else {
                  setCode(data[key]);
                }
              }}
            >
              <SelectTrigger className="h-7 w-[150px] bg-background text-xs shadow-none">
                <SelectValue placeholder="Code View" />
              </SelectTrigger>
              <SelectContent>
                {selectableStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {getLabel(state)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <CopyCode code={source} />
        </div>
      )}

      <SyntaxHighlighter
        style={highlighterStyle}
        language={lang}
        PreTag="div"
        showLineNumbers={true}
        wrapLines={true}
        useInlineStyles={true}
        customStyle={{
          ...codeWindowStyle,
          margin: 0,
          borderRadius: 0,
          background: surface.background,
          padding: '16px 16px 16px 0',
          lineHeight: LINE_HEIGHT,
          overflow: showAll ? 'auto' : 'hidden',
          maxHeight: showAll ? (height ?? '288px') : undefined,
          // A sample shorter than the collapsed view still leaves the button room to sit over it.
          minHeight: showAll ? undefined : `calc(${COLLAPSED_LINES} * (${LINE_HEIGHT}) + 32px)`,
        }}
        // The theme paints its own background and 1.5 line height on the code tag, over the window's.
        codeTagProps={{ ...codeTag, style: { ...codeTag.style, background: 'transparent', lineHeight: LINE_HEIGHT } }}
        lineNumberStyle={{ minWidth: '64px', paddingRight: '24px' }}
      >
        {showAll ? source : lines.slice(0, COLLAPSED_LINES).join('\n')}
      </SyntaxHighlighter>

      {!showAll && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${surface.background}, color-mix(in srgb, ${surface.background} 60%, transparent), transparent)`,
            }}
          />
          {/* `relative` only lifts the button above the fade. */}
          <Button variant="outline" size="sm" className="relative font-normal" onClick={() => setExpanded(true)}>
            View Code
          </Button>
        </div>
      )}
    </div>
  );
};
