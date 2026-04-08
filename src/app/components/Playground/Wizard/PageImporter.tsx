import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Alert, AlertDescription } from '../../ui/alert';
import { AlertTriangleIcon, GlobeIcon, Loader2Icon } from 'lucide-react';

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

async function fetchWithProxy(url: string): Promise<string> {
  // Try direct fetch first (works for same-origin or CORS-enabled sites)
  for (const buildProxyUrl of [null, ...CORS_PROXIES]) {
    try {
      const fetchUrl = buildProxyUrl ? buildProxyUrl(url) : url;
      const response = await fetch(fetchUrl, {
        headers: { Accept: 'text/html' },
      });
      if (response.ok) {
        return await response.text();
      }
    } catch {
      // Try next proxy
    }
  }
  throw new Error(
    'Could not fetch the page. The site may block automated requests. Try copying the page content manually and pasting it into the Content field.'
  );
}

/**
 * Walk a DOM subtree and convert it to a simplified markdown string,
 * extracting headings, paragraphs, lists, images, and links.
 */
function htmlToMarkdown(html: string, sourceUrl: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove noise elements
  const removeSelectors = [
    'script', 'style', 'noscript', 'iframe', 'svg', 'nav', 'footer',
    'header', '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '.cookie-banner', '.cookie-consent', '#cookie-notice',
  ];
  for (const sel of removeSelectors) {
    doc.querySelectorAll(sel).forEach((el) => el.remove());
  }

  // Try to find the main content area
  const main =
    doc.querySelector('main') ||
    doc.querySelector('article') ||
    doc.querySelector('[role="main"]') ||
    doc.querySelector('.content') ||
    doc.querySelector('#content') ||
    doc.body;

  const lines: string[] = [];
  const images: string[] = [];

  function resolveUrl(src: string): string {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('//')) return `https:${src}`;
    if (src.startsWith('/')) {
      try {
        const u = new URL(sourceUrl);
        return `${u.origin}${src}`;
      } catch {
        return src;
      }
    }
    try {
      return new URL(src, sourceUrl).href;
    } catch {
      return src;
    }
  }

  function getTextContent(el: Element): string {
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function walk(node: Element, depth: number = 0) {
    if (depth > 20) return;
    const tag = node.tagName?.toLowerCase();

    // Skip hidden elements
    const style = node.getAttribute('style') || '';
    if (style.includes('display:none') || style.includes('display: none') ||
        style.includes('visibility:hidden') || style.includes('visibility: hidden')) {
      return;
    }

    switch (tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const text = getTextContent(node);
        if (text) {
          const level = parseInt(tag[1], 10);
          lines.push('');
          lines.push(`${'#'.repeat(level)} ${text}`);
        }
        return;
      }
      case 'p': {
        const text = getTextContent(node);
        if (text) {
          lines.push('');
          lines.push(text);
        }
        // Also capture inline images
        node.querySelectorAll('img').forEach((img) => {
          const src = resolveUrl(img.getAttribute('src') || img.getAttribute('data-src') || '');
          const alt = img.getAttribute('alt') || '';
          if (src) images.push(`![${alt}](${src})`);
        });
        return;
      }
      case 'img': {
        const src = resolveUrl(
          node.getAttribute('src') || node.getAttribute('data-src') || ''
        );
        const alt = node.getAttribute('alt') || '';
        if (src && !src.includes('data:image') && !src.includes('.svg')) {
          images.push(`![${alt}](${src})`);
        }
        return;
      }
      case 'picture': {
        const img = node.querySelector('img');
        if (img) {
          const src = resolveUrl(
            img.getAttribute('src') || img.getAttribute('data-src') || ''
          );
          const alt = img.getAttribute('alt') || '';
          if (src && !src.includes('data:image')) {
            images.push(`![${alt}](${src})`);
          }
        }
        return;
      }
      case 'figure': {
        const img = node.querySelector('img');
        const caption = node.querySelector('figcaption');
        if (img) {
          const src = resolveUrl(
            img.getAttribute('src') || img.getAttribute('data-src') || ''
          );
          const alt = img.getAttribute('alt') || caption?.textContent?.trim() || '';
          if (src && !src.includes('data:image')) {
            images.push(`![${alt}](${src})`);
          }
        }
        if (caption) {
          const text = getTextContent(caption);
          if (text) lines.push(`*${text}*`);
        }
        return;
      }
      case 'ul':
      case 'ol': {
        lines.push('');
        const items = node.querySelectorAll(':scope > li');
        items.forEach((li, i) => {
          const text = getTextContent(li);
          if (text) {
            const prefix = tag === 'ol' ? `${i + 1}.` : '-';
            lines.push(`${prefix} ${text}`);
          }
        });
        return;
      }
      case 'blockquote': {
        const text = getTextContent(node);
        if (text) {
          lines.push('');
          lines.push(`> ${text}`);
        }
        return;
      }
      case 'a': {
        // Don't process links as standalone blocks, they're inline
        break;
      }
      case 'table': {
        const rows = node.querySelectorAll('tr');
        if (rows.length > 0) {
          lines.push('');
          rows.forEach((row) => {
            const cells = row.querySelectorAll('th, td');
            const cellTexts = Array.from(cells).map((c) => getTextContent(c as Element));
            lines.push(`| ${cellTexts.join(' | ')} |`);
          });
        }
        return;
      }
      default:
        break;
    }

    // Recurse into children
    for (const child of Array.from(node.children)) {
      walk(child, depth + 1);
    }
  }

  walk(main);

  // Extract page title
  const title = doc.querySelector('title')?.textContent?.trim();
  const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content');

  let result = '';
  if (title) result += `# ${title}\n\n`;
  if (metaDescription) result += `${metaDescription}\n\n`;
  result += '---\n\n';
  result += lines.filter((l) => l !== undefined).join('\n').replace(/\n{3,}/g, '\n\n').trim();

  if (images.length > 0) {
    result += '\n\n---\n\n## Images found on page\n\n';
    // Deduplicate images
    const unique = [...new Set(images)];
    result += unique.join('\n');
  }

  return result.trim();
}

interface PageImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (content: string) => void;
}

export default function PageImporter({ open, onOpenChange, onImport }: PageImporterProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState('');

  const handleClose = () => {
    onOpenChange(false);
    setUrl('');
    setError(null);
    setExtracted('');
    setLoading(false);
  };

  const handleFetch = useCallback(async () => {
    if (!url.trim()) return;

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      setError('Please enter a valid URL.');
      return;
    }

    setLoading(true);
    setError(null);
    setExtracted('');

    try {
      const html = await fetchWithProxy(normalizedUrl);
      const markdown = htmlToMarkdown(html, normalizedUrl);

      if (!markdown || markdown.length < 20) {
        setError(
          'Very little content was found on this page. The site may load content dynamically via JavaScript. Try copying the page content manually instead.'
        );
        setLoading(false);
        return;
      }

      setExtracted(markdown);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch page.');
    } finally {
      setLoading(false);
    }
  }, [url]);

  const handleUseContent = () => {
    onImport(extracted);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <GlobeIcon className="h-5 w-5" />
            Import Content from URL
          </DialogTitle>
          <DialogDescription>
            Fetch a web page and extract its text content and images to use as source material for the AI.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-6 py-4">
          <div className="flex shrink-0 gap-2">
            <Input
              placeholder="https://example.com/about"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              disabled={loading}
            />
            <Button onClick={handleFetch} disabled={loading || !url.trim()} className="shrink-0">
              {loading ? <Loader2Icon className="mr-1 h-4 w-4 animate-spin" /> : <GlobeIcon className="mr-1 h-4 w-4" />}
              Fetch
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="shrink-0">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="flex flex-1 flex-col items-center justify-center py-8">
              <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Fetching and parsing page content…</p>
            </div>
          )}

          {extracted && !loading && (
            <>
              <div className="flex shrink-0 items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Extracted {extracted.length.toLocaleString()} characters. Review and edit below before importing.
                </p>
              </div>
              <Textarea
                className="min-h-0 flex-1 resize-none font-mono text-xs"
                value={extracted}
                onChange={(e) => setExtracted(e.target.value)}
              />
            </>
          )}

          {!extracted && !loading && !error && (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-center text-sm text-muted-foreground">
                Enter a URL above and click Fetch to extract page content.
                <br />
                <span className="text-xs">
                  The content will be converted to text that the AI can use to populate your blocks.
                </span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleUseContent} disabled={!extracted}>
            Use This Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
