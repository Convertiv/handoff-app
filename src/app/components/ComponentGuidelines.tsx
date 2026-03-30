import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { MarkdownComponents, remarkCodeMeta } from './Markdown/MarkdownComponents';

export interface ComponentGuidelinesProps {
  content: string;
}

export const ComponentGuidelines: React.FC<ComponentGuidelinesProps> = ({ content }) => {
  return (
    <>
      <div className="prose">
        <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm, remarkCodeMeta]} rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
      </div>
    </>
  );
};

export default ComponentGuidelines;
