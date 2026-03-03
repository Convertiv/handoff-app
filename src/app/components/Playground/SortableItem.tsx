import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { GripVertical, X } from 'lucide-react';
import { SelectedPlaygroundComponent } from './types';
import EditSheet from './EditSheet';

interface SortableItemProps {
  component: SelectedPlaygroundComponent;
  onRemove: (uniqueId: string) => void;
}

export default function SortableItem({ component, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: component.uniqueId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="mb-2">
      <CardContent className="p-4">
        <div className="group relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h4 className="font-medium">{component.title}</h4>
            </div>
          </div>
          <div className="absolute -right-[30px] -top-[30px] flex items-center rounded-md bg-muted p-0 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
            <EditSheet component={component} onClose={() => {}} />
            <Button variant="ghost" size="sm" onClick={() => onRemove(component.uniqueId)} className="cursor-pointer text-destructive hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
