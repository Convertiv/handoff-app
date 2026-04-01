import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Loader2, Plus } from 'lucide-react';
import { PlaygroundComponent } from './types';

interface ComponentCardProps {
  component: PlaygroundComponent;
  onAdd: (component: PlaygroundComponent) => Promise<void>;
  onTagClick: (tag: string) => void;
  onCategoryClick: (category: string) => void;
}

export default function ComponentCard({ component, onAdd, onTagClick, onCategoryClick }: ComponentCardProps) {
  const [adding, setAdding] = useState(false);
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

  return (
    <Card className="relative cursor-pointer transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex h-full">
          <div className="w-1/4">
            {component.image && (
              <div className="flex h-full justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${basePath}${component.image}`}
                  alt={component.title}
                  className="object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <div className="w-3/4 p-4">
            <div className="flex-1">
              <CardTitle className="text-lg">
                {component.title}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={async () => {
                        setAdding(true);
                        await onAdd(component);
                        setAdding(false);
                      }}
                      variant="default"
                      disabled={adding}
                      className="absolute bottom-2 left-0 ml-2 h-5 w-4 rounded p-2"
                    >
                      {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Click to add this component</TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription className="mt-1">{component.description || 'No description available'}</CardDescription>
              <div className="mt-auto flex flex-wrap justify-end gap-1 pt-3">
                <Badge variant="secondary" className="cursor-pointer text-xs" onClick={() => onCategoryClick(component.group)}>
                  {component.group}
                </Badge>
                {component.tags?.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="cursor-pointer text-xs" onClick={() => onTagClick(tag)}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
