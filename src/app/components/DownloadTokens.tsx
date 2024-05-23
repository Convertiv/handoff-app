import React from 'react';
import Icon from './Icon';

interface DownloadTokensProps {
  componentId: string;
  scss: string;
  css: string;
  styleDictionary: string;
  types: string;
}

export const DownloadTokens: React.FC<DownloadTokensProps> = ({ componentId, css, scss, styleDictionary, types }) => {
  return (
    <div>
      <a
        href={'data:text/plain;charset=utf-8,' + encodeURIComponent(css)}
        download={`${componentId}.css`}
        className="c-button c-button--outline c-button--small"
      >
        CSS Tokens <Icon name="download" className="o-icon" />
      </a>
      <a
        href={'data:text/plain;charset=utf-8,' + encodeURIComponent(scss)}
        download={`${componentId}.scss`}
        className="c-button c-button--outline c-button--small u-ml-2"
      >
        SASS Tokens <Icon name="download" className="o-icon" />
      </a>
      <a
        href={'data:text/plain;charset=utf-8,' + encodeURIComponent(styleDictionary)}
        download={`${componentId}.tokens.json`}
        className="c-button c-button--outline c-button--small u-ml-2"
      >
        Style Dictionary <Icon name="download" className="o-icon" />
      </a>
      <a
        href={'data:text/plain;charset=utf-8,' + encodeURIComponent(types)}
        download={`${componentId}.scss`}
        className="c-button c-button--outline c-button--small u-ml-2"
      >
        Component Types <Icon name="download" className="o-icon" />
      </a>
    </div>
  );
};
