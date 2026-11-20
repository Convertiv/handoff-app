'use client';

import type { DocumentMenuComponent } from '@handoff/screens/client-api';
import type { AnyCollection } from '@handoff/screens/define';
import type { StoredDocument } from '@handoff/screens/types';
import { emptyValue } from '@handoff/screens/validate';
import { Check, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useSession } from '../../lib/screens/client/context';
import { useCollection, useDocument } from '../../lib/screens/client/data';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { ConfirmDialog } from '../ui/confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';

const NameDialog: React.FC<{
  open: boolean;
  title: string;
  initial: string;
  confirmLabel: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void> | void;
}> = ({ open, title, initial, confirmLabel, onOpenChange, onSubmit }) => {
  const [name, setName] = React.useState(initial);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  React.useEffect(() => {
    if (open) {
      setName(initial);
      setError(null);
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-w-sm">
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!name.trim()) return;
            setPending(true);
            try {
              await onSubmit(name.trim());
              onOpenChange(false);
            } catch (failure) {
              setError((failure as Error).message);
            } finally {
              setPending(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">Type a name.</DialogDescription>
          </DialogHeader>
          <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} aria-label="Name" maxLength={200} />
          {error && <p className="text-[13px] text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Switch, create, rename and delete the documents of a collection. A document's name is the string
 * in `titleField`; a new document is the schema's empty document with that name, unless `create`
 * builds it.
 */
export const DocumentMenu: DocumentMenuComponent = <C extends AnyCollection>({
  collection,
  current,
  onOpen,
  titleField = 'title' as never,
  create,
  autoOpen = true,
  noun = 'document',
}: Parameters<DocumentMenuComponent>[0] & { collection: C }) => {
  const list = useCollection(collection, { limit: 200 });
  const open = useDocument(collection, current);
  const session = useSession();
  const [dialog, setDialog] = React.useState<'create' | 'rename' | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const field = titleField as string;
  const titleOf = (data: unknown, id: string): string => {
    const value = (data as Record<string, unknown> | undefined)?.[field];
    return typeof value === 'string' && value.trim() ? value : id;
  };
  const currentTitle = !current
    ? `No ${noun}`
    : open.data === undefined && open.status === 'loading'
      ? 'Loading…'
      : titleOf(open.data, current);

  // Open a document when none is open, or the open one was deleted.
  const firstOther = list.documents.find((document) => document.id !== current)?.id ?? null;
  const currentMissing = Boolean(current) && open.status === 'missing';
  // A screen usually passes a new `onOpen` each render; the effect must run on data changes only.
  const onOpenRef = React.useRef(onOpen);
  onOpenRef.current = onOpen;
  React.useEffect(() => {
    if (!autoOpen || list.status !== 'ready') return;
    if (!current && firstOther) onOpenRef.current(firstOther);
    else if (currentMissing) onOpenRef.current(firstOther);
  }, [autoOpen, list.status, current, currentMissing, firstOther]);

  const createDocument = async (name: string) => {
    const data = create ? create(name) : { ...(emptyValue(collection.schema) as Record<string, unknown>), [field]: name };
    const stored = (await list.create(data)) as StoredDocument<unknown>;
    onOpen(stored.id);
  };

  return (
    <div className="flex min-w-0 items-center gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-8 max-w-[260px] min-w-0 gap-1 px-2 text-[13px] font-semibold">
            <span className="truncate">{list.status === 'loading' && !current ? 'Loading…' : currentTitle}</span>
            <ChevronDown className="opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">{capitalize(noun)}s</DropdownMenuLabel>
          <div className="max-h-72 overflow-y-auto">
            {list.documents.map((document) => (
              <DropdownMenuItem key={document.id} onSelect={() => onOpen(document.id)} className="text-[13px]">
                <Check className={cn('h-3.5 w-3.5', document.id !== current && 'invisible')} />
                <span className="truncate">
                  {titleOf(document.id === current && open.data !== undefined ? open.data : document.data, document.id)}
                </span>
              </DropdownMenuItem>
            ))}
            {list.status === 'ready' && list.documents.length === 0 && (
              <p className="px-2 py-1.5 text-[13px] text-muted-foreground">No {noun}s yet.</p>
            )}
            {list.status === 'error' && <p className="px-2 py-1.5 text-[13px] text-destructive">{list.error}</p>}
          </div>
          {session.canWrite && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setDialog('create')} className="text-[13px]">
                <Plus className="h-3.5 w-3.5" />
                New {noun}…
              </DropdownMenuItem>
              {current && open.data !== undefined && (
                <>
                  <DropdownMenuItem onSelect={() => setDialog('rename')} className="text-[13px]">
                    <Pencil className="h-3.5 w-3.5" />
                    Rename…
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setConfirmDelete(true)} className="text-[13px] text-destructive focus:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete…
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {session.canWrite && current && open.data !== undefined && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setDialog('rename')}
          title={`Rename this ${noun}`}
          aria-label={`Rename this ${noun}`}
          className="h-8 w-8 text-muted-foreground"
        >
          <Pencil />
        </Button>
      )}
      {session.canWrite && !current && list.status === 'ready' && list.documents.length === 0 && (
        <Button type="button" variant="outline" size="sm" className="h-8 text-[13px]" onClick={() => setDialog('create')}>
          <Plus />
          New {noun}
        </Button>
      )}

      <NameDialog
        open={dialog === 'create'}
        title={`New ${noun}`}
        initial=""
        confirmLabel="Create"
        onOpenChange={(next) => !next && setDialog(null)}
        onSubmit={createDocument}
      />
      <NameDialog
        open={dialog === 'rename'}
        title={`Rename ${noun}`}
        initial={current ? titleOf(open.data, current) : ''}
        confirmLabel="Rename"
        onOpenChange={(next) => !next && setDialog(null)}
        onSubmit={(name) => open.update((data) => ({ ...(data as object), [field]: name }) as never)}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete "${currentTitle}"?`}
        description={`The ${noun} is removed for every reader. This cannot be undone.`}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        variant="destructive"
        onConfirm={async () => {
          if (!current) return;
          await list.remove(current);
          onOpen(firstOther);
        }}
      />
    </div>
  );
};
