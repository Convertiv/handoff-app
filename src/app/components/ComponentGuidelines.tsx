import React from 'react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import rehypeRaw from "rehype-raw";

export interface ComponentGuidelinesProps {
  content: string
}

export const ComponentGuidelines: React.FC<ComponentGuidelinesProps> = ({ content }) => {
  return (
    <>
      <ReactMarkdown className="prose" rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
    </>
  )
};

export default ComponentGuidelines;
