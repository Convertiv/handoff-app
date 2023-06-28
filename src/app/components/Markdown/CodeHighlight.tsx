import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import oneLight from 'react-syntax-highlighter/dist/cjs/styles/prism/one-light';
import html from 'refractor/lang/xml-doc';
import { PreviewObject } from '../../../types';
import CopyCode from '../CopyCode';
SyntaxHighlighter.registerLanguage('html', html);

/**
 * Highlight code for preview elements
 * @param param0
 * @returns ReactElement
 */
export const CodeHighlight: React.FC<{ data: PreviewObject | undefined }> = ({ data }) => {
  if (data) {
    return (
      <div className="c-code-block">
        <SyntaxHighlighter
          // @ts-ignore
          style={oneLight}
          language="html"
          PreTag="div"
          showLineNumbers={true}
          wrapLines={true}
          useInlineStyles={true}
        >
          {data.code}
        </SyntaxHighlighter>
        <CopyCode code={data.code} />
      </div>
    );
  } else {
    return <></>;
  }
};

