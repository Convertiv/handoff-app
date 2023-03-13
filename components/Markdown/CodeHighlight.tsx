import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import html from 'react-syntax-highlighter/dist/cjs/languages/prism/xml-doc';
import { PreviewObject } from 'figma-exporter/src/types';
import CopyCode from 'components/CopyCode';
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

