import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SelectedPlaygroundComponent } from './types';

interface SortableItemProps {
  component: SelectedPlaygroundComponent;
  isActive: boolean;
  onClick: () => void;
  onRemove: (uniqueId: string) => void;
}

export default function SortableItem({ component, isActive, onClick, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: component.uniqueId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex cursor-pointer items-center gap-2 rounded-md border px-2 py-2 text-sm transition-colors',
        isActive
          ? 'border-primary/30 bg-primary/5 text-foreground'
          : 'border-transparent hover:border-border hover:bg-muted/50'
      )}
      onClick={onClick}
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none hover:cursor-grabbing">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <span className="flex-1 truncate font-medium">{component.title}</span>
      <button
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(component.uniqueId);
        }}
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}
