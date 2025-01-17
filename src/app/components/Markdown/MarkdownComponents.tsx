import React, { ReactElement } from 'react';
import { CodeProps, HeadingProps } from 'react-markdown/lib/ast-to-react';

import oneLight from 'react-syntax-highlighter/dist/cjs/styles/prism/one-light';
import bash from 'refractor/lang/bash';
import { default as json, default as markdown } from 'refractor/lang/json';
import sass from 'refractor/lang/sass';
import html from 'refractor/lang/xml-doc';
import yaml from 'refractor/lang/yaml';
// @ts-ignore
import highlight from 'react-syntax-highlighter/src/highlight';
import refractor from 'refractor/core';
import HeadersType from '../Typography/Headers';
const SyntaxHighlighter = highlight(refractor, {});
SyntaxHighlighter.registerLanguage = (_: string, language: any) => refractor.register(language);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('sass', sass);
SyntaxHighlighter.registerLanguage('html', html);

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
  paragraph: (props: { children: React.ReactNode }) => ReactElement;
};

/**
 * Build the headers in markdown
 * @param param0
 * @returns
 */
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
        return <HeadersType.H1>{container(children)}</HeadersType.H1>;
      case 2:
        return <HeadersType.H2>{container(children)}</HeadersType.H2>;
      case 3:
        return <HeadersType.H3>{container(children)}</HeadersType.H3>;
      case 4:
        return <HeadersType.H4>{container(children)}</HeadersType.H4>;
      case 5:
        return <HeadersType.H5>{container(children)}</HeadersType.H5>;
      case 6:
        return <HeadersType.H6>{container(children)}</HeadersType.H6>;

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
  paragraph: ({ children }) => <p className="py-5">{children}</p>,
  code(props) {
    const { className } = props;
    const match = /language-(\w+)/.exec(className || '');
    if (props.children[0]) {
      props.children[0] = props.children[0].toString().trim();
    }
    return match ? (
      <SyntaxHighlighter
        // @ts-ignore
        style={oneLight}
        language={match[1]}
        PreTag="div"
        showLineNumbers={true}
        wrapLines={true}
        useInlineStyles={true}
        {...props}
      ></SyntaxHighlighter>
    ) : (
      <code {...props} />
    );
  },
};

export default Headings;
