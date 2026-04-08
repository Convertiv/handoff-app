import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Check, Film, Grid2X2, ImageIcon, Link2, Search, XIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useEditContext } from './EditContext';
import type { PlaygroundAsset } from './types';

const PLACEHOLDER_PRESETS = [
  { label: '150 x 150', w: 150, h: 150 },
  { label: '300 x 200', w: 300, h: 200 },
  { label: '600 x 400', w: 600, h: 400 },
  { label: '800 x 600', w: 800, h: 600 },
  { label: '1200 x 800', w: 1200, h: 800 },
  { label: '1920 x 1080', w: 1920, h: 1080 },
];

function formatDimensionHint(rules: { min?: { width: number; height: number }; max?: { width: number; height: number }; recommended?: { width: number; height: number } }): string | null {
  if (rules.recommended) return `Recommended: ${rules.recommended.width} x ${rules.recommended.height}`;
  if (rules.min && rules.max) return `${rules.min.width}x${rules.min.height} – ${rules.max.width}x${rules.max.height}`;
  if (rules.min) return `Min: ${rules.min.width} x ${rules.min.height}`;
  if (rules.max) return `Max: ${rules.max.width} x ${rules.max.height}`;
  return null;
}

export default function MediaBrowser() {
  const { handleMediaSelect, setMediaBrowserOpen, mediaBrowserOpen, currentImageRules } = useEditContext();
  const [assets, setAssets] = useState<PlaygroundAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<PlaygroundAsset | null>(null);
  const [src, setSrc] = useState('');
  const [alt, setAlt] = useState('');
  const [activeTab, setActiveTab] = useState('library');

  const [phWidth, setPhWidth] = useState(600);
  const [phHeight, setPhHeight] = useState(400);

  const basePath = typeof process !== 'undefined' ? process.env.HANDOFF_APP_BASE_PATH ?? '' : '';

  const dimensionHint = currentImageRules ? formatDimensionHint(currentImageRules) : null;

  useEffect(() => {
    if (mediaBrowserOpen && assets.length === 0) {
      setLoadingAssets(true);
      fetch(`${basePath}/api/playground-assets.json`)
        .then((r) => (r.ok ? r.json() : { assets: [] }))
        .then((data) => {
          const loaded: PlaygroundAsset[] = data.assets || [];
          setAssets(loaded);
          if (loaded.length === 0) setActiveTab('placeholder');
        })
        .catch(() => {
          setAssets([]);
          setActiveTab('placeholder');
        })
        .finally(() => setLoadingAssets(false));
    }
  }, [mediaBrowserOpen, basePath]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mediaBrowserOpen && currentImageRules) {
      const dims = currentImageRules.recommended || currentImageRules.min || currentImageRules.max;
      if (dims) {
        setPhWidth(dims.width);
        setPhHeight(dims.height);
      }
    }
  }, [mediaBrowserOpen, currentImageRules]);

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return assets;
    const term = searchTerm.toLowerCase();
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.alt?.toLowerCase().includes(term) ||
        a.tags?.some((t) => t.toLowerCase().includes(term))
    );
  }, [assets, searchTerm]);

  const onClose = () => {
    setMediaBrowserOpen(false);
    setSelectedAsset(null);
    setSrc('');
    setAlt('');
    setSearchTerm('');
  };

  const resolveAssetSrc = (asset: PlaygroundAsset) =>
    asset.src.startsWith('http') ? asset.src : `${basePath}${asset.src}`;

  const handleLibrarySelect = () => {
    if (selectedAsset) {
      const resolved = resolveAssetSrc(selectedAsset);
      handleMediaSelect({ src: resolved, srcset: resolved, alt: selectedAsset.alt || '' });
      onClose();
    }
  };

  const handleUrlSelect = () => {
    if (src) {
      handleMediaSelect({ src, srcset: src, alt: alt || '' });
      onClose();
    }
  };

  const handlePlaceholderSelect = () => {
    if (phWidth > 0 && phHeight > 0) {
      const url = `https://placehold.co/${phWidth}x${phHeight}`;
      handleMediaSelect({ src: url, srcset: url, alt: `Placeholder ${phWidth}x${phHeight}` });
      onClose();
    }
  };

  const placeholderPreviewUrl = phWidth > 0 && phHeight > 0 ? `https://placehold.co/${phWidth}x${phHeight}` : '';

  return (
    <Dialog open={mediaBrowserOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>Select Media</DialogTitle>
            {dimensionHint && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {dimensionHint}
              </span>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="library" className="gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Asset Library
            </TabsTrigger>
            <TabsTrigger value="placeholder" className="gap-1.5">
              <Grid2X2 className="h-3.5 w-3.5" />
              Placeholder
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Enter URL
            </TabsTrigger>
          </TabsList>

          {/* ── Library tab ── */}
          <TabsContent value="library" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search assets…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchTerm('')}
                >
                  <XIcon className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {loadingAssets ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {assets.length === 0
                  ? 'No assets available. Add images to config/assets.json or public/assets/playground/.'
                  : 'No assets match your search.'}
              </div>
            ) : (
              <div className="grid max-h-[400px] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
                {filteredAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => setSelectedAsset(asset)}
                    className={cn(
                      'group relative flex flex-col overflow-hidden rounded-lg border-2 text-left transition-colors',
                      selectedAsset?.id === asset.id
                        ? 'border-primary ring-1 ring-primary/30'
                        : 'border-transparent hover:border-muted-foreground/20'
                    )}
                  >
                    <div className="relative aspect-square bg-muted">
                      {asset.type === 'video' ? (
                        <div className="flex h-full items-center justify-center">
                          <Film className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={asset.thumbnail || resolveAssetSrc(asset)}
                          alt={asset.alt}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      {selectedAsset?.id === asset.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <Check className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </div>
                    <span className="truncate px-2 py-1.5 text-xs font-medium">{asset.name}</span>
                  </button>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleLibrarySelect} disabled={!selectedAsset}>
                Select Asset
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* ── Placeholder tab ── */}
          <TabsContent value="placeholder" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDER_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { setPhWidth(p.w); setPhHeight(p.h); }}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                    phWidth === p.w && phHeight === p.h
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor="ph-width" className="text-xs">Width (px)</Label>
                <Input
                  id="ph-width"
                  type="number"
                  min={1}
                  value={phWidth}
                  onChange={(e) => setPhWidth(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <span className="pb-2 text-sm text-muted-foreground">×</span>
              <div className="flex-1 space-y-1">
                <Label htmlFor="ph-height" className="text-xs">Height (px)</Label>
                <Input
                  id="ph-height"
                  type="number"
                  min={1}
                  value={phHeight}
                  onChange={(e) => setPhHeight(Math.max(1, Number(e.target.value)))}
                />
              </div>
            </div>

            {placeholderPreviewUrl && (
              <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={placeholderPreviewUrl}
                  alt={`Placeholder ${phWidth}x${phHeight}`}
                  className="max-h-48 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handlePlaceholderSelect} disabled={phWidth <= 0 || phHeight <= 0}>
                Use Placeholder
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* ── URL tab ── */}
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="media-src">Image URL</Label>
              <Input
                id="media-src"
                placeholder="https://example.com/image.jpg"
                value={src}
                onChange={(e) => setSrc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media-alt">Alt Text</Label>
              <Input
                id="media-alt"
                placeholder="Descriptive alt text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
              />
            </div>
            {src && (
              <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={alt || 'Preview'}
                  className="max-h-48 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleUrlSelect} disabled={!src}>
                Select Image
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
