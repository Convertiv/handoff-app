import { Input } from '../../ui/input';
import { useEditContext } from '../EditContext';

export function TextField({ identifier }: { identifier: string[]; value: any; data: any }) {
  const { getData, handleInputChange } = useEditContext();
  return (
    <Input
      id={identifier[identifier.length - 1]}
      defaultValue={getData(identifier) || ''}
      onChange={(e) => handleInputChange([...identifier], e.target.value)}
    />
  );
}
