import React from 'react';
import HeadersType from '../../Typography/Headers';

export interface TextSliceProps {
  title?: string;
  content?: string;
}

const TextSlice: React.FC<TextSliceProps> = ({ title, content }) => {
  // Don't render anything if both title and content are empty/undefined
  if (!title && !content) {
    return null;
  }

  return (
    <div className="mb-5">
      {title && <HeadersType.H3>{title}</HeadersType.H3>}
      {content && <div dangerouslySetInnerHTML={{ __html: content }} />}
    </div>
  );
};

export default TextSlice;
