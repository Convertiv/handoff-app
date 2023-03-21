import React from 'react';
import Icon from './Icon';
import * as fs from 'fs-extra';

interface DownloadTokensProps {
  componentId: string;
  scss: string;
  css: string;
}

export const DownloadTokens: React.FC<DownloadTokensProps> = ({ componentId, css, scss }) => {
  return (
    <div className="c-hero__meta">
      <small>
        <a href={'data:text/plain;charset=utf-8,' + encodeURIComponent(css)} download={`${componentId}.css`}>
          <Icon name="download" className="u-mr-1" /> CSS Tokens
        </a>
      </small>
      <small>&bull;</small>
      <small>
        <a href={'data:text/plain;charset=utf-8,' + encodeURIComponent(scss)} download={`${componentId}.scss`}>
          <Icon name="download" className="u-mr-1" /> SCSS Tokens
        </a>
      </small>
    </div>
  );
};
