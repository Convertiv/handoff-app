import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { useEditContext } from '../EditContext';

type OptionEntry = { value: string; label: string };

function normalizeOptions(raw: Array<string | { value: string; label: string }>): OptionEntry[] {
  return raw.map((opt) => {
    if (typeof opt === 'string') return { value: opt, label: opt };
    return { value: String(opt.value), label: String(opt.label ?? opt.value) };
  });
}

export function SelectField({ identifier, value }: { identifier: string[]; value: any; data: any }) {
  const { getData, handleInputChange } = useEditContext();
  const current = getData(identifier) ?? value.default ?? '';
  const rawOptions: Array<string | { value: string; label: string }> =
    Array.isArray(value.options) && value.options.length > 0 ? value.options : [];
  const options = normalizeOptions(rawOptions);

  if (options.length === 0) {
    return (
      <input
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        id={identifier[identifier.length - 1]}
        defaultValue={String(current)}
        onChange={(e) => handleInputChange([...identifier], e.target.value)}
      />
    );
  }

  return (
    <Select value={String(current)} onValueChange={(val) => handleInputChange([...identifier], val)}>
      <SelectTrigger id={identifier[identifier.length - 1]}>
        <SelectValue placeholder="Select an option…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
