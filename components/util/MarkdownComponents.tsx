import React, { FunctionComponent, ReactElement } from 'react';
import { CodeProps, HeadingProps } from 'react-markdown/lib/ast-to-react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import yaml from 'react-syntax-highlighter/dist/cjs/languages/prism/yaml';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import markdown from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import sass from 'react-syntax-highlighter/dist/cjs/languages/prism/sass';
import html from 'react-syntax-highlighter/dist/cjs/languages/prism/xml-doc';
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('sass', sass);
SyntaxHighlighter.registerLanguage('html', html);
/**
 * Build resolver props
 */
export type HeadingResolverProps = {
  level: number;
  children: JSX.Element[];
};
/**
 * Custom renderer type that we support
 */
export type CustomRenderers = {
  code: (props: CodeProps) => ReactElement;
  h1: (props: HeadingProps) => ReactElement;
  h2: (props: HeadingProps) => ReactElement;
  h3: (props: HeadingProps) => ReactElement;
  h4: (props: HeadingProps) => ReactElement;
  h5: (props: HeadingProps) => ReactElement;
  h6: (props: HeadingProps) => ReactElement;
};

const Headings = ({ level, children }: HeadingProps) => {
  // Access actual (string) value of heading
  if (children[0]) {
    const heading = children[0];

    // If we have a heading, make it lower case
    let anchor = heading.toString().toLowerCase();

    // Clean anchor (replace special characters whitespaces).
    // Alternatively, use encodeURIComponent() if you don't care about
    // pretty anchor links
    anchor = anchor.replace(/[^a-zA-Z0-9 ]/g, '');
    anchor = anchor.replace(/ /g, '-');

    // Utility
    const container = (children: React.ReactNode): JSX.Element => (
      <>
        {children}
        <a id={anchor} href={`#${anchor}`} className="doc-link" onClick={(e) => console.log(e)}></a>
      </>
    );

    switch (level) {
      case 1:
        return <h1>{container(children)}</h1>;
      case 2:
        return <h2>{container(children)}</h2>;
      case 3:
        return <h3>{container(children)}</h3>;
      case 4:
        return <h4>{container(children)}</h4>;
      case 5:
        return <h5>{container(children)}</h5>;
      case 6:
        return <h6>{container(children)}</h6>;

      default:
        return <h6>{container(children)}</h6>;
    }
  } else {
    return <h1>children</h1>;
  }
};

/**
 * Build custom renderers for markdown
 */
export const MarkdownComponents: CustomRenderers = {
  h1: Headings,
  h2: Headings,
  h3: Headings,
  h4: Headings,
  h5: Headings,
  h6: Headings,
  code(props) {
    const { className } = props;
    const match = /language-(\w+)/.exec(className || '');
    return match ? (
      <SyntaxHighlighter
        // @ts-ignore
        style={oneLight}
        language={match[1]}
        PreTag="div"
        showLineNumbers={true}
        wrapLines={true}
        useInlineStyles={true}
        {...props}></SyntaxHighlighter>
    ) : (
      <code {...props} />
    );
  },
};

export default Headings;
