import { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Switch } from '../../ui/switch';
import { ChevronDownIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useEditContext } from '../EditContext';
import FieldLabel from './FieldLabel';
import { TextField } from './TextField';
import { RichTextField } from './RichTextField';
import { ImageField } from './ImageField';
import { LinkField } from './LinkField';
import { ButtonField } from './ButtonField';
import { SelectField } from './SelectField';

export function renderFormFields(obj: any, data: any, path: string[] = []) {
  return Object.entries(obj).map(([key, value]: [string, any]) => {
    const currentPath = [...path, key];

    if (value.type === 'boolean') {
      return (
        <div key={key} className="flex items-center justify-between pb-4 pt-2">
          <FieldLabel label={obj[key].name || key} htmlFor={currentPath.join('.')} type={value.type} />
          <InputField fieldKey={currentPath} value={value} data={data} />
        </div>
      );
    }

    return (
      <div key={key} className="space-y-2 pb-6 pt-2">
        <div className="flex items-center justify-between">
          <FieldLabel label={obj[key].name || key} htmlFor={currentPath.join('.')} type={value.type} />
        </div>
        <InputField fieldKey={currentPath} value={value} data={data} />
      </div>
    );
  });
}

function ObjectField({ identifier, value, data }: { identifier: string[]; value: any; data: any }) {
  const { getData } = useEditContext();
  return <div className="space-y-2 rounded-lg">{renderFormFields(value.properties, getData(identifier, data), [...identifier])}</div>;
}

function ArrayField({ identifier, value }: { identifier: string[]; value: any; data: any }) {
  const { getData, handleInputChange } = useEditContext();
  if (!value.items?.properties) {
    return <span className="text-sm text-muted-foreground">Missing items properties</span>;
  }
  let items = getData(identifier);
  if (!items) items = [];

  return (
    <div className="space-y-2 rounded-lg">
      {items.map((_item: any, index: number) => (
        <ArrayItem key={index} identifier={[...identifier, index.toString()]} value={value} />
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          handleInputChange([...identifier], [...items, {}]);
        }}
      >
        <PlusIcon className="mr-1 h-4 w-4" /> Add to {value.name}
      </Button>
    </div>
  );
}

function ArrayItem({ identifier, value }: { identifier: string[]; value: any }) {
  const { handleInputChange, getData } = useEditContext();
  const [isOpen, setIsOpen] = useState(false);
  const item = getData(identifier);

  return (
    <div className="relative min-h-[30px] border-b p-3 transition-colors duration-100">
      <div className="flex items-center justify-between">
        <FieldLabel label="Item" htmlFor={identifier[identifier.length - 1]} type={value.items?.type || 'object'} />
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => handleInputChange([...identifier], null)}>
            <Trash2Icon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: isOpen ? '2000px' : 0,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        {renderFormFields(value.items.properties, item, [...identifier])}
      </div>
    </div>
  );
}

export function InputField({ fieldKey, value, data }: { fieldKey: string[]; value: any; data: any }) {
  const { getData, handleInputChange } = useEditContext();
  switch (value.type) {
    case 'object':
      return <ObjectField identifier={fieldKey} value={value} data={data} />;
    case 'array':
      return <ArrayField identifier={fieldKey} value={value} data={data} />;
    case 'image':
      return <ImageField identifier={fieldKey} value={value} data={data} />;
    case 'button':
      return <ButtonField identifier={fieldKey} value={value} data={data} />;
    case 'link':
      return <LinkField identifier={fieldKey} value={value} data={data} />;
    case 'text':
    case 'string':
      return <TextField identifier={fieldKey} value={value} data={data} />;
    case 'richtext':
      return <RichTextField identifier={fieldKey} value={value} data={data} />;
    case 'number':
      return <Input id={fieldKey[fieldKey.length - 1]} value={getData(fieldKey) ?? ''} onChange={(e) => handleInputChange([...fieldKey], Number(e.target.value))} type="number" />;
    case 'boolean':
      return (
        <Switch
          id={fieldKey[fieldKey.length - 1]}
          checked={!!getData(fieldKey)}
          onCheckedChange={(checked) => handleInputChange([...fieldKey], checked)}
        />
      );
    case 'select':
    case 'enum':
      return <SelectField identifier={fieldKey} value={value} data={data} />;
    default:
      return <span className="text-xs text-muted-foreground">{JSON.stringify(value)}</span>;
  }
}
