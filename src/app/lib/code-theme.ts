import type { CSSProperties } from 'react';

/**
 * GitHub light and dark, as Prism styles for `react-syntax-highlighter`.
 *
 * The palette is GitHub's classic code palette — the one Shiki ships as `github-light` / `github-dark`.
 * None of the Prism themes bundled with the library carries it (`ghcolors` is an older GitHub look),
 * and the bundled `github-gist` is a highlight.js theme in light only.
 *
 * **How the library applies these keys, which is why some of them are compound.** Each token span
 * gets the style of every one of its class names, `token` dropped, merged in order: each single class
 * first, then each two-class combination joined with `.`, then three. A later key wins, so a pair
 * always overrides a single. Two consequences:
 *
 * - A token's alias is one of its classes, so `null.keyword` (JSON `null`, aliased `keyword`) can win
 *   over `keyword`, and `title.important` (a Markdown heading) over `important`.
 * - The library flattens nested tokens into one span per leaf carrying *all its ancestors'* classes,
 *   outermost first, and reads only the first four. So an ancestor's colour applies straight onto a
 *   leaf that sets none — which is why containers that hold plain code (`script`, `interpolation`)
 *   reset to the base colour, and why `tag.class-name` can colour a JSX component name differently
 *   from a type name.
 *
 * Descendant selectors (`.language-css .token.x`, `a > b`) never match here — the library only looks
 * keys up by class name — so none are declared.
 *
 * Containers whose children carry the colour (a Markdown table, a TS generic, a CSS at-rule's body)
 * are deliberately left without a key. A language registered later can emit token types with no key
 * here; those render in their ancestors' colour.
 */

type PrismTheme = { [key: string]: CSSProperties };

type Palette = {
  foreground: string;
  background: string;
  comment: string;
  keyword: string;
  string: string;
  entity: string;
  constant: string;
  tag: string;
  variable: string;
  inserted: string;
  deleted: string;
};

const LIGHT: Palette = {
  foreground: '#24292e',
  background: '#f6f8fa',
  comment: '#6a737d',
  keyword: '#d73a49',
  string: '#032f62',
  entity: '#6f42c1',
  constant: '#005cc5',
  tag: '#22863a',
  variable: '#e36209',
  inserted: '#22863a',
  deleted: '#b31d28',
};

const DARK: Palette = {
  foreground: '#e1e4e8',
  background: '#24292e',
  comment: '#6a737d',
  keyword: '#f97583',
  string: '#9ecbff',
  entity: '#b392f0',
  constant: '#79b8ff',
  tag: '#85e89d',
  variable: '#ffab70',
  inserted: '#85e89d',
  deleted: '#fdaeb7',
};

function githubTheme(p: Palette): PrismTheme {
  const base: CSSProperties = {
    color: p.foreground,
    background: p.background,
    fontFamily: '"Fira Code", "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    lineHeight: '1.5',
    MozTabSize: '2',
    OTabSize: '2',
    tabSize: '2',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
  };
  const plain: CSSProperties = { color: p.foreground };
  const comment: CSSProperties = { color: p.comment };
  const keyword: CSSProperties = { color: p.keyword };
  const string: CSSProperties = { color: p.string };
  const entity: CSSProperties = { color: p.entity };
  const constant: CSSProperties = { color: p.constant };
  const tag: CSSProperties = { color: p.tag };
  const variable: CSSProperties = { color: p.variable };
  const inserted: CSSProperties = { color: p.inserted };
  const deleted: CSSProperties = { color: p.deleted };

  return {
    'code[class*="language-"]': base,
    'pre[class*="language-"]': {
      ...base,
      padding: '1em',
      margin: '0.5em 0',
      overflow: 'auto',
      borderRadius: '0.3em',
    },
    ':not(pre) > code[class*="language-"]': {
      padding: '0.2em 0.3em',
      borderRadius: '0.3em',
      whiteSpace: 'normal',
    },

    // Comments and preamble
    comment,
    prolog: comment,
    cdata: comment,
    doctype: comment,
    shebang: comment,
    hashbang: comment,

    // Punctuation, and containers of plain code that must not take an ancestor's colour
    punctuation: plain,
    delimiter: plain,
    brackets: plain,
    script: plain,
    'script-punctuation': plain,
    interpolation: plain,
    // A Handlebars expression inside an HTML attribute carries six classes; the library reads only the
    // first four, so its own `block`/`variable` never apply and it would otherwise read as the string.
    handlebars: plain,
    code: plain,
    'code-language': plain,
    unchanged: plain,

    // Keywords and operators
    keyword,
    operator: keyword,
    rule: keyword,
    important: keyword,
    statement: keyword,
    'module-modifier': keyword,
    directive: keyword,
    'for-or-select': keyword,
    block: keyword,
    'interpolation-punctuation': keyword,
    'attr-equals': keyword,

    // Strings
    string,
    char: string,
    'attr-value': string,
    'template-string': string,
    'template-punctuation': string,
    regex: string,
    url: string,
    'url-reference': string,
    scalar: string,
    'string-property': string,
    'string-property.property': string,
    'attr-value.punctuation': string,
    'attr-value.punctuation.attr-equals': keyword,

    // Functions, types, attribute names, selectors
    function: entity,
    'function-variable': entity,
    'function-name': entity,
    decorator: entity,
    'class-name': entity,
    'attr-name': entity,
    selector: entity,
    'selector-function-argument': entity,
    placeholder: entity,

    // Constants, numbers, properties, built-ins
    constant,
    boolean: constant,
    number: constant,
    null: constant,
    'null.keyword': constant,
    'null.important': constant,
    'boolean.important': constant,
    builtin: constant,
    'builtin.class-name': constant,
    entity: constant,
    'named-entity': constant,
    symbol: constant,
    property: constant,
    'literal-property': constant,
    environment: constant,
    datetime: constant,
    'file-descriptor': constant,
    'code-snippet': constant,
    'code-snippet.keyword': constant,
    'tag.class-name': constant,

    // Tags and keys
    tag,
    key: tag,
    parent: tag,
    'parent.important': tag,
    blockquote: tag,
    'blockquote.punctuation': tag,

    // Variables
    variable,
    'assign-left': variable,
    list: variable,
    'list.punctuation': variable,

    // Markdown emphasis and structure
    title: { color: p.constant, fontWeight: 'bold' },
    'title.important': { color: p.constant, fontWeight: 'bold' },
    hr: { color: p.constant, fontWeight: 'bold' },
    'hr.punctuation': { color: p.constant, fontWeight: 'bold' },
    'table-header': { fontWeight: 'bold' },
    bold: { fontWeight: 'bold' },
    italic: { fontStyle: 'italic' },
    strike: { textDecoration: 'line-through' },

    // Diff
    inserted,
    'inserted-sign': inserted,
    'inserted-arrow': inserted,
    deleted,
    'deleted-sign': deleted,
    'deleted-arrow': deleted,
    coord: { color: p.entity, fontWeight: 'bold' },
    diff: variable,
  };
}

export const githubLight: PrismTheme = githubTheme(LIGHT);
export const githubDark: PrismTheme = githubTheme(DARK);
