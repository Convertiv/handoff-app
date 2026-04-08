import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { ChevronDown, Grid3X3, List, Loader2, Plus, PlusIcon, Search, XIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePlayground } from './PlaygroundContext';
import ComponentCard from './ComponentCard';
import type { PlaygroundComponent } from './types';

type ViewMode = 'grid' | 'table';

function ComponentRow({
  component,
  onAdd,
}: {
  component: PlaygroundComponent;
  onAdd: (c: PlaygroundComponent) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

  return (
    <div className="group flex items-center gap-3 rounded-md border border-transparent px-3 py-2 transition-colors hover:border-border hover:bg-muted/40">
      <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-muted">
        {component.image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`${basePath}${component.image}`}
            alt={component.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{component.title}</p>
        {component.description && (
          <p className="truncate text-xs text-muted-foreground">{component.description}</p>
        )}
      </div>
      {component.group && (
        <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground sm:inline-block">
          {component.group}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 shrink-0 gap-1 px-2 opacity-0 transition-opacity group-hover:opacity-100"
        disabled={adding}
        onClick={async () => {
          setAdding(true);
          try {
            await onAdd(component);
          } finally {
            setAdding(false);
          }
        }}
      >
        {adding ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" />
            Add
          </>
        )}
      </Button>
    </div>
  );
}

export default function ComponentLibrary({ trigger }: { trigger?: React.ReactNode } = {}) {
  const { components, addComponent } = usePlayground();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const groups = useMemo(() => {
    const set = new Set<string>();
    components.forEach((c) => {
      if (c.group) set.add(c.group);
    });
    return Array.from(set).sort();
  }, [components]);

  const filteredComponents = useMemo(() => {
    return components.filter((component) => {
      if (selectedGroup && component.group !== selectedGroup) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        component.title.toLowerCase().includes(term) ||
        component.description?.toLowerCase().includes(term) ||
        component.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    });
  }, [components, searchTerm, selectedGroup]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="relative">
            <PlusIcon className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>Add Components</DialogTitle>
          <DialogDescription>Click a component to add it to your page</DialogDescription>
        </DialogHeader>

        {/* Search + filters bar */}
        <div className="flex shrink-0 items-center gap-2 border-b px-6 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search components…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setSearchTerm('')}
              >
                <XIcon className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {groups.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5">
                  {selectedGroup || 'All groups'}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedGroup(null)}>
                  <span className={cn(!selectedGroup && 'font-medium')}>All groups</span>
                </DropdownMenuItem>
                {groups.map((group) => (
                  <DropdownMenuItem key={group} onClick={() => setSelectedGroup(group)}>
                    <span className={cn(selectedGroup === group && 'font-medium')}>{group}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="flex shrink-0 items-center rounded-md border">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-l-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-r-md transition-colors',
                viewMode === 'table'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Component listing */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredComponents.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredComponents.map((component) => (
                  <ComponentCard key={component.id} component={component} onAdd={addComponent} />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredComponents.map((component) => (
                  <ComponentRow key={component.id} component={component} onAdd={addComponent} />
                ))}
              </div>
            )
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              {selectedGroup
                ? `No components found in "${selectedGroup}" matching your search.`
                : 'No components found matching your search.'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
