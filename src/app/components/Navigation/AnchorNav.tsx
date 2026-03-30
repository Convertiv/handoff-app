import { TextQuote } from 'lucide-react';
import AnchorNavLink from './AnchorNavLink';

import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

export const anchorSlugify = (text: string): string => {
  let anchor = text.toString().toLowerCase();
  anchor = anchor.replace(/[^a-zA-Z0-9 ]/g, '');
  anchor = anchor.replace(/ /g, '-');
  return anchor;
};

interface TOCProps {
  body: React.RefObject<HTMLDivElement>;
  title: string;
}
export function PageTOC({ body, title }: TOCProps) {
  const [headers, setHeaders] = React.useState<{ id: string; title: string | null; level: number }[]>([]);
  const router = useRouter();

  const scanHeaders = React.useCallback(() => {
    if (!body.current) return;
    const found = Array.from(body.current.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((node) => ({
      id: anchorSlugify(node?.textContent?.toString() ?? ''),
      title: node.textContent,
      level: parseInt(node.tagName[1]),
    }));
    setHeaders(found);
  }, [body]);

  useEffect(() => {
    // Scan after paint to catch SSR-hydrated content
    requestAnimationFrame(scanHeaders);

    // Watch for dynamically inserted headings (client-rendered markdown)
    const el = body.current;
    if (!el) return;
    const observer = new MutationObserver(scanHeaders);
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [body, scanHeaders]);

  useEffect(() => {
    const handler = () => requestAnimationFrame(scanHeaders);
    router.events.on('routeChangeComplete', handler);
    return () => router.events.off('routeChangeComplete', handler);
  }, [router, scanHeaders]);
  return (
    <AnchorNav
      title={title}
      groups={headers.reduce((acc, header) => {
        if (header.level === 1) {
          acc.push({ [header.id]: header.title ?? '' });
        } else {
          if (acc.length === 0) {
            acc.push({ [header.id]: header.title ?? '' });
          } else {
            acc[acc.length - 1][header.id] = header.title ?? '';
          }
        }
        return acc;
      }, [])}
    />
  );
}

export interface AnchorNavProps {
  title?: string;
  groups?: { [name: string]: string }[];
}

export const AnchorNav: React.FC<AnchorNavProps> = ({ title, groups }) => {
  return (
    <div className="hidden text-sm xl:block">
      <div className="sticky top-24">
        <p className="relative mb-7 flex items-center gap-3 text-sm text-gray-500 after:absolute after:bottom-[-12px] after:left-0 after:h-px after:w-[130px] after:bg-gray-200 dark:text-gray-400 dark:after:bg-gray-800">
          <TextQuote className="h-[14px] w-[14px] opacity-50" strokeWidth={2} /> {title ?? 'On This Page'}
        </p>
        <ul className="space-y-3">
          {groups?.map((linkGroup, i) => (
            <React.Fragment key={`link-group-${i}`}>
              {Object.entries(linkGroup).map(([key, value]) => (
                <li key={key}>
                  <AnchorNavLink to={key}>{value}</AnchorNavLink>
                </li>
              ))}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AnchorNav;
