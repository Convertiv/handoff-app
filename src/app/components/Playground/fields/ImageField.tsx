import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { ImageIcon, ImageOff, Trash2Icon } from 'lucide-react';
import { useEditContext } from '../EditContext';

export function ImageField({ identifier, value }: { identifier: string[]; value: any; data: any }) {
  const { getData, handleInputChange, setCurrentImagePath, setCurrentImageRules, setMediaBrowserOpen } = useEditContext();

  const imgData = getData(identifier);
  const hasSrc = !!imgData?.src;

  const openBrowser = () => {
    setCurrentImagePath(identifier);
    setCurrentImageRules(value.rules?.dimensions ?? null);
    setMediaBrowserOpen(true);
  };

  const removeImage = () => {
    handleInputChange([...identifier, 'src'], '');
    handleInputChange([...identifier, 'srcset'], '');
  };

  return (
    <div className="space-y-2 rounded-lg">
      {hasSrc && (
        <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgData.src}
            alt={imgData.alt || 'Preview'}
            className="max-h-40 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={openBrowser}>
          <ImageIcon className="h-3.5 w-3.5" />
          {hasSrc ? 'Change Image' : 'Select Image'}
        </Button>
        {hasSrc && (
          <Button type="button" variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive" onClick={removeImage}>
            <Trash2Icon className="h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${identifier[identifier.length - 1]}_alt`} className="text-xs">
          Alt text
        </Label>
        <Input
          id={`${identifier[identifier.length - 1]}_alt`}
          defaultValue={imgData?.alt || ''}
          onChange={(e) => handleInputChange([...identifier, 'alt'], e.target.value)}
        />
      </div>

      {value.description && <p className="text-xs text-muted-foreground">{value.description}</p>}
    </div>
  );
}
