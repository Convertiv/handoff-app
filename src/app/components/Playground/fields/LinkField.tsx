import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useEditContext } from '../EditContext';

export function LinkField({ identifier, value }: { identifier: string[]; value: any; data: any }) {
  const { getData, handleInputChange } = useEditContext();
  return (
    <div className="space-y-2 rounded-lg">
      <Label htmlFor={`${identifier[identifier.length - 1]}_text`}>Label</Label>
      <Input
        id={`${identifier[identifier.length - 1]}_text`}
        defaultValue={getData(identifier)?.text || ''}
        onChange={(e) => handleInputChange([...identifier, 'text'], e.target.value)}
      />
      <Label htmlFor={`${identifier[identifier.length - 1]}_url`}>URL</Label>
      <Input
        id={`${identifier[identifier.length - 1]}_url`}
        defaultValue={getData(identifier)?.url || ''}
        onChange={(e) => handleInputChange([...identifier, 'url'], e.target.value)}
      />
      {value.description && <p className="text-sm text-muted-foreground">{value.description}</p>}
    </div>
  );
}
