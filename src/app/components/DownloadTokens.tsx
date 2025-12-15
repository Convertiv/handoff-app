import { Download } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { buttonVariants } from './ui/button';

interface DownloadTokensProps {
  componentId: string;
  scss: string;
  css: string;
  styleDictionary: string;
  types: string;
}

export const DownloadTokens: React.FC<DownloadTokensProps> = ({ componentId, css, scss, styleDictionary, types }) => {
  return (
    <div className="mt-3 flex flex-row flex-wrap gap-3">
      <Link
        className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' font-normal [&_svg]:size-3!'}
        href={'data:text/plain;charset=utf-8,' + encodeURIComponent(css)}
        download={`${componentId}.css`}
      >
        CSS Tokens <Download strokeWidth={1.5} />
      </Link>

      <Link
        className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' font-normal [&_svg]:size-3!'}
        href={'data:text/plain;charset=utf-8,' + encodeURIComponent(scss)}
        download={`${componentId}.scss`}
      >
        SASS Tokens <Download strokeWidth={1.5} />
      </Link>

      <Link
        className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' font-normal [&_svg]:size-3!'}
        href={'data:text/plain;charset=utf-8,' + encodeURIComponent(styleDictionary)}
        download={`${componentId}.tokens.json`}
      >
        Style Dictionary <Download strokeWidth={1.5} />
      </Link>

      <Link
        className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' font-normal [&_svg]:size-3!'}
        href={'data:text/plain;charset=utf-8,' + encodeURIComponent(types)}
        download={`${componentId}.scss`}
      >
        Component Types <Download strokeWidth={1.5} />
      </Link>
    </div>
  );
};
