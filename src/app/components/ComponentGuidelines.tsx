import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export interface ComponentGuidelinesProps {
  content: string;
}

export const ComponentGuidelines: React.FC<ComponentGuidelinesProps> = ({ content }) => {
  return (
    <>
      <div className="prose">
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
      </div>
    </>
  );
};

export default ComponentGuidelines;
