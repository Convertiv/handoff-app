import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../ui/tooltip';
import { ImageIcon, ImageOff } from 'lucide-react';
import { useEditContext } from '../EditContext';

export function ImageField({ identifier, value }: { identifier: string[]; value: any; data: any }) {
  const { getData, handleInputChange, setCurrentImagePath, setMediaBrowserOpen } = useEditContext();

  let idealWidth = 0;
  let idealHeight = 0;
  if (value.rules?.dimensions?.min) {
    idealWidth = value.rules.dimensions.min.width;
    idealHeight = value.rules.dimensions.min.height;
  }
  if (value.rules?.dimensions?.max) {
    idealWidth = value.rules.dimensions.max.width;
    idealHeight = value.rules.dimensions.max.height;
  }
  if (value.rules?.dimensions?.recommended) {
    idealWidth = value.rules.dimensions.recommended.width;
    idealHeight = value.rules.dimensions.recommended.height;
  }

  return (
    <div className="space-y-2 rounded-lg">
      {getData(identifier)?.src && (
        <div className="mb-3 flex items-center justify-center overflow-hidden rounded-lg bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getData(identifier)?.src} alt={getData(identifier)?.alt || 'Preview'} className="max-h-40 object-contain" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex-1 pe-2">
          <Label htmlFor={identifier[identifier.length - 1]} className="sr-only">
            Image path
          </Label>
          <Input
            id={identifier[identifier.length - 1]}
            defaultValue={getData(identifier)?.src || ''}
            onChange={(e) => {
              handleInputChange([...identifier, 'src'], e.target.value);
              handleInputChange([...identifier, 'srcset'], e.target.value);
            }}
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="my-2"
              onClick={() => {
                setCurrentImagePath(identifier);
                setMediaBrowserOpen(true);
              }}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{getData(identifier)?.src ? 'Change Image' : 'Select Image'}</TooltipContent>
        </Tooltip>
        {idealHeight > 0 && idealWidth > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="my-2"
                onClick={() => {
                  handleInputChange([...identifier, 'src'], `https://placehold.co/${idealWidth}x${idealHeight}`);
                  handleInputChange([...identifier, 'srcset'], `https://placehold.co/${idealWidth}x${idealHeight}`);
                }}
              >
                <ImageOff className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Use Placeholder Image</TooltipContent>
          </Tooltip>
        )}
      </div>
      <Label htmlFor={`${identifier[identifier.length - 1]}_alt`}>Alt text</Label>
      <Input
        id={`${identifier[identifier.length - 1]}_alt`}
        defaultValue={getData(identifier)?.alt || ''}
        onChange={(e) => handleInputChange([...identifier, 'alt'], e.target.value)}
      />
      {value.description && <p className="text-sm text-muted-foreground">{value.description}</p>}
    </div>
  );
}
