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

export default CopyCode;
