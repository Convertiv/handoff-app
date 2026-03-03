import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

interface PreviewProps {
  html: string;
  className?: string;
}

export default function Preview({ html, className }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      }
    }
  }, [html]);

  return <iframe ref={iframeRef} className={cn('h-full w-full', className)} title="Component Preview" sandbox="allow-scripts allow-same-origin" />;
}
