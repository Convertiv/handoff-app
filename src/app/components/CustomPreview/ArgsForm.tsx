'use client';

import {
  emptyFieldValue,
  getAt,
  jsonEqual,
  pathKey,
  setAt,
  unsetAt,
  type CustomPreviewArgs,
  type CustomPreviewIssue,
  type Field,
  type FieldEntry,
  type FieldPath,
} from '@handoff/custom-previews';
import { AlertCircle, ChevronDown, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Toggle } from '../ui/toggle';

type FormState = {
  args: CustomPreviewArgs;
  onChange: (next: CustomPreviewArgs) => void;
  issues: Map<string, CustomPreviewIssue[]>;
  disabled: boolean;
};

const FormContext = React.createContext<FormState | null>(null);

const useForm = () => {
  const form = React.useContext(FormContext)!;
  return {
    ...form,
    value: (path: FieldPath) => getAt(form.args, path),
    set: (path: FieldPath, value: unknown) => form.onChange(setAt(form.args, path, value) as CustomPreviewArgs),
    unset: (path: FieldPath) => form.onChange(unsetAt(form.args, path) as CustomPreviewArgs),
  };
};

const fieldId = (path: FieldPath) => `custom-preview-field-${pathKey(path)}`;

const isUnset = (value: unknown): value is null | undefined => value === undefined || value === null;

const KIND_LABELS: Record<Field['kind'], string> = {
  text: 'text',
  number: 'number',
  boolean: 'boolean',
  enum: 'enum',
  object: 'object',
  array: 'list',
  function: 'function',
  json: 'JSON',
};

const IssueList: React.FC<{ issues: CustomPreviewIssue[] }> = ({ issues }) =>
  issues.length ? (
    <ul className="space-y-0.5">
      {issues.map((issue, index) => (
        <li key={index} className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          <span>{issue.message}</span>
        </li>
      ))}
    </ul>
  ) : null;

type ControlProps = { field: Field; path: FieldPath; clearable: boolean };

const TextControl: React.FC<ControlProps> = ({ field, path, clearable }) => {
  const { value, set, unset, disabled } = useForm();
  const current = value(path);
  // A `text` prop can hold an object, such as an element. Editing it as text would lose it.
  if (current !== null && typeof current === 'object') return <JsonControl field={field} path={path} clearable={clearable} />;
  return (
    <Input
      id={fieldId(path)}
      className="h-8"
      value={isUnset(current) ? '' : String(current)}
      disabled={disabled}
      onChange={(event) => {
        const next = event.target.value;
        if (next === '' && clearable) unset(path);
        else set(path, next);
      }}
    />
  );
};

const NumberControl: React.FC<ControlProps> = ({ path, clearable }) => {
  const { value, set, unset, disabled } = useForm();
  const current = value(path);
  const shown = isUnset(current) ? '' : String(current);
  const [draft, setDraft] = React.useState(shown);

  // Keep a partial entry such as `1.` while it still means the stored number.
  React.useEffect(() => {
    if (draft.trim() === '' ? current !== undefined : Number(draft) !== current) setDraft(shown);
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Input
      id={fieldId(path)}
      type="number"
      step="any"
      className="h-8"
      value={draft}
      disabled={disabled}
      onChange={(event) => {
        const next = event.target.value;
        setDraft(next);
        if (next.trim() === '') {
          if (clearable) unset(path);
          return;
        }
        const number = Number(next);
        if (Number.isFinite(number)) set(path, number);
      }}
    />
  );
};

const BooleanControl: React.FC<ControlProps> = ({ path }) => {
  const { value, set, disabled } = useForm();
  const current = value(path);
  return (
    <Toggle
      id={fieldId(path)}
      variant="outline"
      size="sm"
      className="h-8 min-w-16 font-mono text-xs"
      pressed={current === true}
      disabled={disabled}
      onPressedChange={(pressed) => set(path, pressed)}
    >
      {isUnset(current) ? 'Not set' : String(current)}
    </Toggle>
  );
};

const UNSET_OPTION = '__unset';

const EnumControl: React.FC<ControlProps & { options: unknown[] }> = ({ path, clearable, options }) => {
  const { value, set, unset, disabled } = useForm();
  const current = value(path);
  const quoteStrings = options.some((option) => typeof option !== 'string');
  const optionLabel = (option: unknown) => (typeof option === 'string' && !quoteStrings ? option : JSON.stringify(option));
  const index = options.findIndex((option) => jsonEqual(option, current));
  const selected = index >= 0 ? String(index) : isUnset(current) && clearable ? UNSET_OPTION : '';
  return (
    <Select
      value={selected}
      disabled={disabled}
      onValueChange={(next) => (next === UNSET_OPTION ? unset(path) : set(path, options[Number(next)]))}
    >
      <SelectTrigger id={fieldId(path)} className="h-8">
        <SelectValue placeholder={isUnset(current) ? 'Not set' : `${optionLabel(current)} (not an option)`} />
      </SelectTrigger>
      <SelectContent>
        {clearable && <SelectItem value={UNSET_OPTION}>Not set</SelectItem>}
        {options.map((option, optionIndex) => (
          <SelectItem key={optionIndex} value={String(optionIndex)}>
            {optionLabel(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const stringify = (value: unknown) => (value === undefined ? '' : JSON.stringify(value, null, 2));

const sameJson = (text: string, value: unknown) => {
  if (text.trim() === '') return value === undefined;
  try {
    return jsonEqual(JSON.parse(text), value);
  } catch {
    return false;
  }
};

const JsonControl: React.FC<ControlProps> = ({ path, clearable }) => {
  const { value, set, unset, disabled } = useForm();
  const current = value(path);
  const shown = stringify(current);
  const [text, setText] = React.useState(shown);
  const [error, setError] = React.useState<string | null>(null);

  // Invalid text stays local, so only a change from outside replaces it.
  React.useEffect(() => {
    if (!sameJson(text, current)) {
      setText(shown);
      setError(null);
    }
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-1">
      <textarea
        id={fieldId(path)}
        className="min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs shadow-xs focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
        rows={Math.min(Math.max(text.split('\n').length, 2), 12)}
        spellCheck={false}
        value={text}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          if (next.trim() === '') {
            setError(null);
            if (clearable) unset(path);
            return;
          }
          try {
            set(path, JSON.parse(next));
            setError(null);
          } catch {
            setError('Invalid JSON. The last valid value is kept.');
          }
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

const FunctionControl: React.FC<{ signature: string }> = ({ signature }) => (
  <div className="flex items-center gap-2 rounded-md border border-dashed border-input px-3 py-1.5">
    <code className="truncate font-mono text-xs text-muted-foreground" title={signature}>
      {signature}
    </code>
    <span className="ml-auto shrink-0 text-[10px] tracking-wide text-muted-foreground uppercase">Set in code</span>
  </div>
);

const itemSummary = (item: unknown, fields: FieldEntry[]): string | null => {
  for (const entry of fields) {
    const value = getAt(item, [entry.key]);
    if (entry.field.kind === 'text' && typeof value === 'string' && value.trim()) return value;
  }
  return null;
};

const countIssuesUnder = (issues: Map<string, CustomPreviewIssue[]>, path: FieldPath) => {
  const key = pathKey(path);
  let count = 0;
  issues.forEach((list, issuePath) => {
    if (issuePath === key || issuePath.startsWith(`${key}.`)) count += list.length;
  });
  return count;
};

const ObjectItem: React.FC<{ fields: FieldEntry[]; path: FieldPath; index: number; defaultOpen: boolean; onRemove: () => void }> = ({
  fields,
  path,
  index,
  defaultOpen,
  onRemove,
}) => {
  const { value, issues, disabled } = useForm();
  const [open, setOpen] = React.useState(defaultOpen);
  const summary = itemSummary(value(path), fields);
  const issueCount = countIssuesUnder(issues, path);
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 px-2 py-1">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
          <span className="font-medium">Item {index + 1}</span>
          {summary && <span className="truncate text-muted-foreground">{summary}</span>}
          {issueCount > 0 && (
            <span className="shrink-0 rounded-full bg-amber-50 px-1.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-600/20 ring-inset dark:bg-amber-950/40 dark:text-amber-300">
              {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
            </span>
          )}
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          aria-label={`Remove item ${index + 1}`}
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {open && (
        <div className="border-t border-gray-200 px-3 pb-1 dark:border-gray-800">
          <IssueList issues={issues.get(pathKey(path)) ?? []} />
          {fields.map((entry) => (
            <FieldRow key={entry.key} entry={entry} path={[...path, entry.key]} />
          ))}
        </div>
      )}
    </div>
  );
};

const FOCUSABLE = 'input, textarea, button[role="combobox"]';

const ArrayControl: React.FC<{ item: Field; path: FieldPath; label: string }> = ({ item, path, label }) => {
  const form = useForm();
  const current = form.value(path);
  const items = Array.isArray(current) ? current : [];
  const listRef = React.useRef<HTMLDivElement>(null);
  // Cleared after focus, so a later add at the same index focuses again.
  const [addedIndex, setAddedIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (addedIndex === null) return;
    listRef.current?.querySelector<HTMLElement>(`[data-item-index="${addedIndex}"]`)?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    setAddedIndex(null);
  }, [addedIndex]);

  const add = () => {
    setAddedIndex(items.length);
    form.set(path, [...items, emptyFieldValue(item)]);
  };

  return (
    <div ref={listRef} className="space-y-1.5">
      {items.map((value, index) => {
        const itemPath = [...path, index];
        const remove = () => form.set(path, items.filter((_, other) => other !== index));
        if ('fields' in item) {
          return (
            <div key={index} data-item-index={index}>
              <ObjectItem fields={item.fields} path={itemPath} index={index} defaultOpen={index === addedIndex} onRemove={remove} />
            </div>
          );
        }
        return (
          <div key={index} data-item-index={index} className="space-y-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <FieldControl field={item} path={itemPath} clearable={false} label={`${label} ${index + 1}`} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label={`Remove item ${index + 1}`}
                disabled={form.disabled}
                onClick={remove}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <IssueList issues={form.issues.get(pathKey(itemPath)) ?? []} />
          </div>
        );
      })}
      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled={form.disabled} onClick={add}>
        <Plus className="h-3.5 w-3.5" /> Add item
      </Button>
    </div>
  );
};

const ObjectControl: React.FC<{ fields: FieldEntry[]; path: FieldPath; clearable: boolean; label: string }> = ({
  fields,
  path,
  clearable,
  label,
}) => {
  const { value, set, disabled } = useForm();
  if (clearable && isUnset(value(path))) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed border-input px-3 py-1">
        <span className="text-xs text-muted-foreground">Not set</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-6 gap-1 px-2 text-[11px]"
          aria-label={`Add ${label}`}
          disabled={disabled}
          onClick={() => set(path, {})}
        >
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
    );
  }
  return (
    <div className="border-l border-gray-200 pl-3 dark:border-gray-800">
      {fields.map((entry) => (
        <FieldRow key={entry.key} entry={entry} path={[...path, entry.key]} />
      ))}
    </div>
  );
};

const FieldControl: React.FC<ControlProps & { label: string }> = ({ field, path, clearable, label }) => {
  const { value } = useForm();
  switch (field.kind) {
    case 'text':
      return <TextControl field={field} path={path} clearable={clearable} />;
    case 'number':
      return <NumberControl field={field} path={path} clearable={clearable} />;
    case 'boolean':
      return <BooleanControl field={field} path={path} clearable={clearable} />;
    case 'enum':
      return <EnumControl field={field} path={path} clearable={clearable} options={field.options} />;
    case 'object':
      return <ObjectControl fields={field.fields} path={path} clearable={clearable} label={label} />;
    case 'array': {
      // A value that is not a list would be lost by editing it as one.
      const current = value(path);
      return isUnset(current) || Array.isArray(current) ? (
        <ArrayControl item={field.item} path={path} label={label} />
      ) : (
        <JsonControl field={field} path={path} clearable={clearable} />
      );
    }
    case 'function':
      return <FunctionControl signature={field.signature} />;
    default:
      return <JsonControl field={field} path={path} clearable={clearable} />;
  }
};

const LEAF_KINDS = new Set<Field['kind']>(['text', 'number', 'boolean', 'enum', 'json']);

const FieldRow: React.FC<{ entry: FieldEntry; path: FieldPath }> = ({ entry, path }) => {
  const { value, unset, issues, disabled } = useForm();
  const current = value(path);
  const canUnset = !entry.required && current !== undefined && entry.field.kind !== 'function';
  return (
    <div className="space-y-1.5 py-2" data-field-path={pathKey(path)}>
      <div className="flex min-h-6 items-center gap-2">
        <Label htmlFor={LEAF_KINDS.has(entry.field.kind) ? fieldId(path) : undefined} className="text-xs">
          {entry.label}
          {entry.required && (
            <>
              <span aria-hidden className="ml-0.5 text-amber-700 dark:text-amber-400">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          )}
        </Label>
        <span className="font-mono text-[10px] text-muted-foreground">{KIND_LABELS[entry.field.kind]}</span>
        {canUnset && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2 text-[11px]"
            aria-label={`Unset ${entry.label}`}
            disabled={disabled}
            onClick={() => unset(path)}
          >
            Unset
          </Button>
        )}
      </div>
      {entry.description && <p className="text-xs text-muted-foreground">{entry.description}</p>}
      <FieldControl field={entry.field} path={path} clearable={!entry.required} label={entry.label} />
      <IssueList issues={issues.get(pathKey(path)) ?? []} />
    </div>
  );
};

export const ArgsForm: React.FC<{
  fields: FieldEntry[];
  args: CustomPreviewArgs;
  onChange: (next: CustomPreviewArgs) => void;
  issues: CustomPreviewIssue[];
  disabled: boolean;
}> = ({ fields, args, onChange, issues, disabled }) => {
  const issuesByPath = React.useMemo(() => {
    const map = new Map<string, CustomPreviewIssue[]>();
    for (const issue of issues) map.set(issue.path, [...(map.get(issue.path) ?? []), issue]);
    return map;
  }, [issues]);
  const state = React.useMemo<FormState>(
    () => ({ args, onChange, issues: issuesByPath, disabled }),
    [args, onChange, issuesByPath, disabled]
  );

  return (
    <FormContext.Provider value={state}>
      <div className="divide-y divide-gray-100 px-6 py-2 dark:divide-gray-800">
        {fields.map((entry) => (
          <FieldRow key={entry.key} entry={entry} path={[entry.key]} />
        ))}
      </div>
    </FormContext.Provider>
  );
};
