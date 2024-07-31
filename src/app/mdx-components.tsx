import type { MDXComponents } from 'mdx/types';
import Image, { ImageProps } from 'next/image';
import { CodeHighlight } from './components/Markdown/CodeHighlight';

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

export function useMDXComponents(components: MDXComponents): MDXComponents {
  console.log(components);
  return {
    // Allows customizing built-in components, e.g. to add styling.
    h1: ({ children }) => <h1>{children}</h1>,
    img: (props) => <Image sizes="100vw" style={{ width: '100%', height: 'auto' }} {...(props as ImageProps)} />,
    code: (props) => <CodeHighlight {...props} data={props.children.toString()} />,
    pre: (props) => {
      const language = 'css';
      //props.children.props.className.replace('language-', '')
      // @ts-ignore
      return <CodeHighlight {...props} data={props.children.props.children.toString()} type={language} />;
    },
    ...components,
  };
}
