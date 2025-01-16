import React from 'react';
import Icon from './Icon';
import { ArrowRight, Download } from 'lucide-react';
import { Button } from './ui/button';

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
      <Button>
        <a href={'data:text/plain;charset=utf-8,' + encodeURIComponent(css)} download={`${componentId}.css`}>
          CSS Tokens <Download className="inline-block transition-transform group-hover:translate-x-1" />
        </a>
      </Button>
      <Button>
        <a href={'data:text/plain;charset=utf-8,' + encodeURIComponent(scss)} download={`${componentId}.scss`}>
          SASS Tokens <Download className="inline-block transition-transform group-hover:translate-x-1" />
        </a>
      </Button>
      <Button>
        <a href={'data:text/plain;charset=utf-8,' + encodeURIComponent(styleDictionary)} download={`${componentId}.tokens.json`}>
          Style Dictionary <Download className="inline-block transition-transform group-hover:translate-x-1" />
        </a>
      </Button>
      <Button>
        <a href={'data:text/plain;charset=utf-8,' + encodeURIComponent(types)} download={`${componentId}.scss`}>
          Component Types <Download className="inline-block transition-transform group-hover:translate-x-1" />
        </a>
      </Button>
    </div>
  );
};
