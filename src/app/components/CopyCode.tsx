import * as React from 'react';
import Icon from './Icon';

export interface CopyCodeProps {
  code: string;
}

export const CopyCode: React.FC<CopyCodeProps> = ({ code }) => {
  const [copy, setCopy] = React.useState('Copy code to clipboard');

  return (
    <a
      href="#"
      className="c-code-block__button c-tooltip"
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
      <Icon name="copy" width={15} height={15}/>
    </a>
  );
};

export interface DownloadCodeProps {
  code: string;
  filename: string;
}

export const DownloadCode: React.FC<DownloadCodeProps> = ({ code, filename }) => {
  const [download, setDownload] = React.useState('Download code as file');

  return (
    <a
      href={'data:text/plain;charset=utf-8,' + encodeURIComponent(code)}
      className="c-code-block__button c-tooltip"
      data-tooltip={download}
      data-download-state="download"
      onMouseEnter={(e) => setDownload('Download code as file')}
    >
      <Icon name="download" width={15} height={15}/>
    </a>
  );
};

export default CopyCode;
