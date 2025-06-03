import { Copy, Download } from 'lucide-react';
import * as React from 'react';
import { Button } from './ui/button';

export interface CopyCodeProps {
  code: string;
}

export const CopyCode: React.FC<CopyCodeProps> = ({ code }) => {
  const [copy, setCopy] = React.useState('Copy code to clipboard');

  return (
    <Button variant="ghost" size={'sm'} asChild>
      <a
        href="#"
        className="h-7 px-3 hover:bg-gray-300 [&_svg]:size-3"
        data-tooltip={copy}
        data-copy-state="copy"
        onMouseEnter={(e) => setCopy('Copy code to clipboard')}
        onClick={(e) => {
          e.preventDefault();
          if (window) {
            navigator.clipboard.writeText(code);
            setCopy('Copied');
          }
        }}
      >
        <Copy />
      </a>
    </Button>
  );
};

export interface DownloadCodeProps {
  code: string;
  filename: string;
}

export const DownloadCode: React.FC<DownloadCodeProps> = ({ code, filename }) => {
  const [download, setDownload] = React.useState('Download code as file');

  return (
    <Button variant="ghost" asChild>
      <a
        href={'data:text/plain;charset=utf-8,' + encodeURIComponent(code)}
        className="c-code-block__button c-tooltip"
        data-tooltip={download}
        data-download-state="download"
        onMouseEnter={(e) => setDownload('Download code as file')}
      >
        <Download />
      </a>
    </Button>
  );
};

export default CopyCode;
