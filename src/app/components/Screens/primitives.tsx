'use client';

import { moveTo } from '@handoff/screens/instances';
import type { ScreenUi, SegmentedControlProps, SortableHandle, SortableListProps } from '@handoff/screens/client-api';
import * as Icons from 'lucide-react';
import * as React from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';

/**
 * The `ui` primitives of `handoff-app/screens`: a curated, stable subset of the docs app's
 * components plus the list and layout pieces that screens share.
 */

/**
 * Icons by kebab-case name. A fixed set, not every Lucide icon: a lookup over all of them would
 * add a chunk per icon to every build.
 */
const ICONS: Record<string, Icons.LucideIcon> = {
  activity: Icons.Activity,
  'alert-triangle': Icons.TriangleAlert,
  'arrow-down': Icons.ArrowDown,
  'arrow-left': Icons.ArrowLeft,
  'arrow-right': Icons.ArrowRight,
  'arrow-up': Icons.ArrowUp,
  bookmark: Icons.Bookmark,
  bot: Icons.Bot,
  box: Icons.Box,
  boxes: Icons.Boxes,
  brush: Icons.Brush,
  calendar: Icons.Calendar,
  'chart-bar': Icons.ChartBar,
  check: Icons.Check,
  'check-square': Icons.SquareCheck,
  'chevron-down': Icons.ChevronDown,
  'chevron-left': Icons.ChevronLeft,
  'chevron-right': Icons.ChevronRight,
  'circle-help': Icons.CircleHelp,
  clipboard: Icons.Clipboard,
  'clipboard-list': Icons.ClipboardList,
  clock: Icons.Clock,
  compass: Icons.Compass,
  component: Icons.Component,
  copy: Icons.Copy,
  download: Icons.Download,
  'external-link': Icons.ExternalLink,
  eye: Icons.Eye,
  file: Icons.File,
  'file-text': Icons.FileText,
  files: Icons.Files,
  flag: Icons.Flag,
  folder: Icons.Folder,
  gauge: Icons.Gauge,
  'git-branch': Icons.GitBranch,
  globe: Icons.Globe,
  'grid-3x3': Icons.Grid3x3,
  'grip-vertical': Icons.GripVertical,
  hammer: Icons.Hammer,
  heart: Icons.Heart,
  history: Icons.History,
  image: Icons.Image,
  inbox: Icons.Inbox,
  info: Icons.Info,
  kanban: Icons.Kanban,
  layers: Icons.Layers,
  'layout-dashboard': Icons.LayoutDashboard,
  'layout-grid': Icons.LayoutGrid,
  'layout-list': Icons.LayoutList,
  'layout-panel-left': Icons.LayoutPanelLeft,
  'layout-template': Icons.LayoutTemplate,
  link: Icons.Link,
  list: Icons.List,
  'list-checks': Icons.ListChecks,
  'list-ordered': Icons.ListOrdered,
  lock: Icons.Lock,
  map: Icons.Map,
  'message-square': Icons.MessageSquare,
  minus: Icons.Minus,
  monitor: Icons.Monitor,
  'more-horizontal': Icons.Ellipsis,
  move: Icons.Move,
  notebook: Icons.Notebook,
  'notebook-pen': Icons.NotebookPen,
  package: Icons.Package,
  paintbrush: Icons.Paintbrush,
  palette: Icons.Palette,
  'panel-left': Icons.PanelLeft,
  pencil: Icons.Pencil,
  play: Icons.Play,
  plus: Icons.Plus,
  puzzle: Icons.Puzzle,
  'refresh-cw': Icons.RefreshCw,
  rocket: Icons.Rocket,
  ruler: Icons.Ruler,
  save: Icons.Save,
  search: Icons.Search,
  settings: Icons.Settings,
  shield: Icons.Shield,
  'sliders-horizontal': Icons.SlidersHorizontal,
  smartphone: Icons.Smartphone,
  sparkles: Icons.Sparkles,
  star: Icons.Star,
  'swatch-book': Icons.SwatchBook,
  table: Icons.Table,
  tablet: Icons.Tablet,
  tag: Icons.Tag,
  tags: Icons.Tags,
  'trash-2': Icons.Trash2,
  type: Icons.Type,
  upload: Icons.Upload,
  user: Icons.User,
  users: Icons.Users,
  'wand-sparkles': Icons.WandSparkles,
  wrench: Icons.Wrench,
  x: Icons.X,
  zap: Icons.Zap,
};

export const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  const Glyph = ICONS[name] ?? Icons.Square;
  return <Glyph aria-hidden className={cn('h-4 w-4', className)} />;
};

/** An icon name renders through {@link Icon}; an element renders as given. */
export const renderIcon = (icon: string | React.ReactNode | undefined, className?: string): React.ReactNode =>
  typeof icon === 'string' ? <Icon name={icon} className={className} /> : icon;

export const Grid: ScreenUi['Grid'] = ({ min = 160, className, style, ...props }) => (
  <div
    className={cn('grid gap-3', className)}
    style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`, ...style }}
    {...props}
  />
);

export const SearchInput: ScreenUi['SearchInput'] = ({ value, onChange, placeholder = 'Search', autoFocus, className }) => (
  <div className={cn('relative', className)}>
    <Icons.Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      type="search"
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
    />
    {value && (
      <button
        type="button"
        aria-label="Clear the search"
        onClick={() => onChange('')}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
      >
        <Icons.X className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

export const EmptyState: ScreenUi['EmptyState'] = ({ title, description, icon, action, actionLabel = 'Add', className }) => (
  <div className={cn('flex flex-col items-center gap-3 rounded-lg border border-dashed bg-background px-6 py-10 text-center', className)}>
    {icon && (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {renderIcon(icon, 'h-5 w-5')}
      </div>
    )}
    <div className="space-y-1">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-muted-foreground">{description}</p>}
    </div>
    {typeof action === 'function' ? (
      <Button type="button" size="sm" onClick={action}>
        <Icons.Plus />
        {actionLabel}
      </Button>
    ) : (
      action
    )}
  </div>
);

export const Loading: ScreenUi['Loading'] = ({ label = 'Loading', className }) => (
  <div
    role="status"
    aria-label={label}
    className={cn('flex h-full w-full animate-loading-in items-center justify-center text-muted-foreground', className)}
  >
    <Icons.Loader2 className="h-5 w-5 animate-spin" />
  </div>
);

export const AddButton: ScreenUi['AddButton'] = ({ children = 'Add', onClick, disabled, className }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed px-2 py-2 text-[13px] text-muted-foreground transition-colors hover:border-solid hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50',
      className
    )}
  >
    <Icons.Plus className="h-3.5 w-3.5" />
    {children}
  </button>
);

export const ListRow: ScreenUi['ListRow'] = ({ title, subtitle, icon, selected, warning, actions, onClick, handle, className }) => (
  <div
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    aria-pressed={onClick ? Boolean(selected) : undefined}
    onClick={onClick}
    onKeyDown={(event) => {
      if (onClick && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onClick();
      }
    }}
    className={cn(
      'group flex min-h-9 items-center gap-1.5 rounded-md border bg-background px-2 py-2 text-[13px] outline-hidden transition-colors focus-visible:ring-1 focus-visible:ring-ring',
      onClick && 'cursor-pointer hover:bg-accent/60',
      selected && 'border-primary bg-primary/5 ring-1 ring-primary hover:bg-primary/10',
      handle?.dragging && 'shadow-md',
      className
    )}
  >
    {handle && (
      <span
        {...handle.props}
        className="-ml-0.5 flex h-5 w-4 shrink-0 cursor-grab items-center justify-center rounded-sm text-muted-foreground outline-hidden hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing"
      >
        <Icons.GripVertical className="h-3.5 w-3.5" />
      </span>
    )}
    {icon && <span className="shrink-0 text-muted-foreground">{renderIcon(icon, 'h-3.5 w-3.5')}</span>}
    <div className="min-w-0 flex-1">
      <div className={cn('truncate', selected ? 'font-semibold' : 'font-medium')}>{title}</div>
      {subtitle && <div className="truncate text-[11px] text-muted-foreground">{subtitle}</div>}
    </div>
    {warning && (
      <span title={warning} aria-label={warning} className="shrink-0 text-amber-500">
        <Icons.TriangleAlert className="h-3.5 w-3.5" />
      </span>
    )}
    {actions && (
      <div
        className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 focus-within:opacity-100"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {actions}
      </div>
    )}
  </div>
);

const GRIP_LABEL = 'Reorder: drag, or press the up and down arrow keys';
const SLIDE_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/**
 * Slides rows from their previous place to their new one whenever the order changes, and fades in
 * added rows. Positions are layout offsets, so scrolling the list does not count as a move.
 */
const useRowMotion = (items: { id: string }[]) => {
  const rows = React.useRef(new Map<string, HTMLDivElement>());
  const offsets = React.useRef(new Map<string, number>());

  React.useLayoutEffect(() => {
    const previous = offsets.current;
    const next = new Map<string, number>();
    const animate = previous.size > 0 && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    rows.current.forEach((row, id) => {
      // A row still sliding starts its next slide from where it is drawn.
      const running = row.getAnimations().filter((animation) => animation.id === 'sortable-slide');
      const drawnOffset = running.length ? new DOMMatrixReadOnly(getComputedStyle(row).transform).m42 : 0;
      running.forEach((animation) => animation.cancel());
      const top = row.offsetTop;
      next.set(id, top);
      if (!animate) return;
      const before = previous.get(id);
      if (before === undefined) {
        row.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: SLIDE_EASE });
        return;
      }
      const offset = before + drawnOffset - top;
      if (Math.abs(offset) < 0.5) return;
      row.animate([{ transform: `translateY(${offset}px)` }, { transform: 'none' }], {
        id: 'sortable-slide',
        duration: 260,
        easing: SLIDE_EASE,
      });
    });
    offsets.current = next;
  }, [items]);

  return (id: string) => (row: HTMLDivElement | null) => {
    if (row) rows.current.set(id, row);
    else rows.current.delete(id);
  };
};

/**
 * A vertical list that a reader reorders by dragging a row's grip, or with the arrow keys on the
 * grip. Native drag and drop covers one vertical list, so it needs no drag library.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
}: SortableListProps<T>): React.ReactElement {
  const [armedId, setArmedId] = React.useState<string | null>(null);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const rowRef = useRowMotion(items);
  // Moving a row in the DOM drops focus from its grip, so a keyboard move gives it back.
  const refocusId = React.useRef<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    const id = refocusId.current;
    if (!id) return;
    refocusId.current = null;
    const row = listRef.current?.querySelector(`[data-sortable-id="${CSS.escape(id)}"]`);
    row?.querySelector<HTMLElement>(`[aria-label="${GRIP_LABEL}"]`)?.focus({ preventScroll: true });
    row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [items]);

  const reset = () => {
    setArmedId(null);
    setDraggingId(null);
    setDropIndex(null);
  };

  const drop = () => {
    if (draggingId !== null && dropIndex !== null) {
      const from = items.findIndex((item) => item.id === draggingId);
      const to = dropIndex > from ? dropIndex - 1 : dropIndex;
      if (from >= 0 && to !== from) onReorder(moveTo(items, draggingId, to));
    }
    reset();
  };

  const marker = <div aria-hidden className="pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-primary" />;

  return (
    <div
      ref={listRef}
      className={cn('relative flex flex-col gap-1.5', className)}
      onDragLeave={(event) => event.currentTarget === event.target && setDropIndex(null)}
    >
      {items.map((item, index) => {
        const handle: SortableHandle = {
          dragging: draggingId === item.id,
          props: {
            role: 'button',
            tabIndex: 0,
            'aria-label': GRIP_LABEL,
            onPointerDown: () => setArmedId(item.id),
            onPointerUp: () => setArmedId(null),
            onClick: (event) => event.stopPropagation(),
            onKeyDown: (event) => {
              const step = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
              if (!step) return;
              event.preventDefault();
              event.stopPropagation();
              const target = index + step;
              if (target < 0 || target >= items.length) return;
              refocusId.current = item.id;
              onReorder(moveTo(items, item.id, target));
            },
          },
        };
        return (
          <div
            key={item.id}
            ref={rowRef(item.id)}
            data-sortable-id={item.id}
            // Only a pressed grip makes the row draggable, so text in the row stays selectable.
            draggable={armedId === item.id}
            onDragStart={(event) => {
              setDraggingId(item.id);
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', item.id);
            }}
            onDragOver={(event) => {
              if (!draggingId) return;
              event.preventDefault();
              const box = event.currentTarget.getBoundingClientRect();
              setDropIndex(event.clientY > box.top + box.height / 2 ? index + 1 : index);
            }}
            onDrop={(event) => {
              event.preventDefault();
              drop();
            }}
            onDragEnd={reset}
            className={cn('relative transition-opacity', draggingId === item.id && 'opacity-40')}
          >
            {draggingId && dropIndex === index && <div className="absolute inset-x-0 -top-1">{marker}</div>}
            {renderItem(item, handle, index)}
            {draggingId && dropIndex === index + 1 && index === items.length - 1 && (
              <div className="absolute inset-x-0 -bottom-1">{marker}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SegmentedControl<V extends string>({ value, onChange, options, className }: SegmentedControlProps<V>): React.ReactElement {
  return (
    <div role="radiogroup" className={cn('inline-flex items-center gap-0.5 rounded-lg border bg-muted/50 p-0.5', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.title}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-hidden transition-colors focus-visible:ring-1 focus-visible:ring-ring',
              active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.icon && <Icon name={option.icon} className="h-3.5 w-3.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export const ui: ScreenUi = {
  Button,
  Input,
  Label,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Separator,
  Grid,
  SearchInput,
  EmptyState,
  Loading,
  AddButton,
  SortableList,
  ListRow,
  SegmentedControl,
  Icon,
};
