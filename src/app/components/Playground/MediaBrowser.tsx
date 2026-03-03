import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useEditContext } from './EditContext';

export default function MediaBrowser() {
  const { handleMediaSelect, setMediaBrowserOpen, mediaBrowserOpen } = useEditContext();
  const [src, setSrc] = useState('');
  const [alt, setAlt] = useState('');

  const onClose = () => setMediaBrowserOpen(false);

  const handleConfirm = () => {
    if (src) {
      handleMediaSelect({ src, srcset: src, alt: alt || '' });
      setSrc('');
      setAlt('');
    }
  };

  return (
    <Dialog open={mediaBrowserOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Set Image URL</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="media-src">Image URL</Label>
            <Input id="media-src" placeholder="https://example.com/image.jpg" value={src} onChange={(e) => setSrc(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="media-alt">Alt Text</Label>
            <Input id="media-alt" placeholder="Descriptive alt text" value={alt} onChange={(e) => setAlt(e.target.value)} />
          </div>
          {src && (
            <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt || 'Preview'} className="max-h-48 object-contain" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!src}>
            Select Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
