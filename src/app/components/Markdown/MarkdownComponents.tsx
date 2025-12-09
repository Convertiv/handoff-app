import React, { ReactElement } from 'react';
import oneLight from 'react-syntax-highlighter/dist/cjs/styles/prism/one-light';
//import { CodeProps, HeadingProps } from 'react-markdown/lib/ast-to-react';

// @ts-ignore
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import markdown from 'react-syntax-highlighter/dist/esm/languages/hljs/markdown';
import sass from 'react-syntax-highlighter/dist/esm/languages/hljs/scss';
import html from 'react-syntax-highlighter/dist/esm/languages/hljs/xml';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import highlight from 'react-syntax-highlighter/src/highlight';
import refractor from 'refractor/core';
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
  code: (props: any) => ReactElement;
  h1: (props: any) => ReactElement;
  h2: (props: any) => ReactElement;
  h3: (props: any) => ReactElement;
  h4: (props: any) => ReactElement;
  h5: (props: any) => ReactElement;
  h6: (props: any) => ReactElement;
  paragraph: (props: { children: React.ReactNode }) => ReactElement;
};

/**
 * Build the headers in markdown
 * @param param0
 * @returns
 */
const Headings = (element) => {
  const { children, node } = element;
  // Access actual (string) value of heading
  if (children[0]) {
    const heading = children[0];
    const type = node.tagName || 'h6';

    // If we have a heading, make it lower case
    let anchor = heading.toString().toLowerCase();

    // Clean anchor (replace special characters whitespaces).
    // Alternatively, use encodeURIComponent() if you don't care about
    // pretty anchor links
    anchor = anchor.replace(/[^a-zA-Z0-9 ]/g, '');
    anchor = anchor.replace(/ /g, '-');

    // Utility
    const container = (children: React.ReactNode): React.ReactNode => (
      <>
        {children}
        <a id={anchor} href={`#${anchor}`} className="doc-link" onClick={(e) => console.log(e)}></a>
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
        return (
          <h6 className="text-xs font-bold">
            {JSON.stringify(type)}: {container(children)}
          </h6>
        );
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
  paragraph: ({ children }) => <p>{children}</p>,
  code(props) {
    const { className } = props;
    const match = /language-(\w+)/.exec(className || '');
    // This was designed to flatten out children arrays, but I think its not needed
    // if (props.children[0]) {
    //   props.children[0] = props.children[0].toString().trim();
    // }
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
