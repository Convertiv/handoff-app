'use client';

import { Loader2, Pencil } from 'lucide-react';
import * as React from 'react';

import HeadersType from '../Typography/Headers';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export const EditableTitle: React.FC<{
  title: string;
  placeholder: string;
  maxLength: number;
  canEdit: boolean;
  onSave: (title: string) => Promise<void> | void;
}> = ({ title, placeholder, maxLength, canEdit, onSave }) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(title);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const open = () => {
    setDraft(title);
    setError(null);
    setEditing(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(next);
      setEditing(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The title could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            autoFocus
            aria-label="Title"
            value={draft}
            maxLength={maxLength}
            placeholder={placeholder}
            disabled={saving}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && setEditing(false)}
            className="h-10 max-w-2xl flex-1 text-lg"
          />
          <Button type="submit" size="sm" disabled={saving || !draft.trim()}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <HeadersType.H1>{title || placeholder}</HeadersType.H1>
      {canEdit && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Edit title"
          title="Edit title"
          onClick={open}
          className="text-muted-foreground [&_svg]:size-4"
        >
          <Pencil />
        </Button>
      )}
    </div>
  );
};
