import { Label } from '../../ui/label';
import { TextIcon, Image, LinkIcon, GroupIcon, TextSelectIcon, MousePointerClickIcon, ToggleLeftIcon } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  text: TextIcon,
  image: Image,
  link: LinkIcon,
  button: MousePointerClickIcon,
  select: TextSelectIcon,
  array: GroupIcon,
  boolean: ToggleLeftIcon,
};

export default function FieldLabel({ label, htmlFor, type }: { label: string; htmlFor: string; type: string }) {
  const Icon = iconMap[type];
  return (
    <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
      {Icon ? <Icon className="h-4 w-4" /> : null} {label}
    </Label>
  );
}
