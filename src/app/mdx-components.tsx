import type { MDXComponents } from 'mdx/types';
import Image, { ImageProps } from 'next/image';
import { CodeHighlight } from './components/Markdown/CodeHighlight';
import HeadersType from './components/Typography/Headers';

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Allows customizing built-in components, e.g. to add styling.
    h1: ({ children }) => <HeadersType.H1>{children}</HeadersType.H1>,
    h2: ({ children }) => <HeadersType.H2>{children}</HeadersType.H2>,
    h3: ({ children }) => <HeadersType.H3>{children}</HeadersType.H3>,
    h4: ({ children }) => <HeadersType.H4>{children}</HeadersType.H4>,
    h5: ({ children }) => <HeadersType.H5>{children}</HeadersType.H5>,
    h6: ({ children }) => <HeadersType.H6>{children}</HeadersType.H6>,
    p: ({ children }) => <p className="py-2">{children}</p>,

    img: (props) => <Image sizes="100vw" style={{ width: '100%', height: 'auto' }} {...(props as ImageProps)} />,
    code: (props) => {
      if (props.children.toString().includes('\n')) {
        let title = '';
        // @ts-ignore
        if (props.codetitle) {
          // @ts-ignore
          title = props.codetitle;
        }
        let col = '12';
        let type = 'html';
        if (props.className) {
          const match = props.className.match(/language-(\w+)/);
          if (match) {
            type = match[1];
          }
        }
        // @ts-ignore
        if (props.col) {
          // @ts-ignore
          col = props.col;
        }
        return <CodeHighlight type={type} key={props.key} data={props.children.toString().trim()} title={title} dark={true} />;
      } else {
        return <code className="inline-code">{props.children}</code>;
      }
    },
    pre: (props) => {
      return <>{props.children}</>;
    },
    //   const language = 'css';
    //   //props.children.props.className.replace('language-', '')
    //   // @ts-ignore
    //   return <CodeHighlight {...props} data={props.children.props.children.toString()} type={language} />;
    // },
    ...components,
  };
}
