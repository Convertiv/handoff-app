import type {
  ButtonHTMLAttributes,
  ComponentType,
  FC,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactElement,
  ReactNode,
} from 'react';
import type { AnyCollection, AnyScreenOptions, ComponentInstance, DocumentOf, OptionsOf, ScreenRole } from './define';
import type {
  ArgsIssue,
  CollectionQuery,
  ComponentContract,
  ComponentInfo,
  ComponentQuery,
  ComponentSummary,
  InstanceAssessment,
  PatternInfo,
  PatternQuery,
  StoredDocument,
} from './types';

/**
 * Signatures of the `handoff-app/screens` hooks and components. The docs app implements them and
 * checks its implementation against these types, so the public declarations and the code that runs
 * cannot drift apart.
 */

// ---------------------------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------------------------

/**
 * - `idle`: no id was given
 * - `loading`, `missing`: the first read is running, or found no document
 * - `saved`: the shown data is stored
 * - `dirty`, `saving`: a change waits for, or is in, its debounced save
 * - `conflict`: another writer saved first; call `resolveConflict`
 * - `error`: the last read or write failed; see `error`
 */
export type DocumentStatus = 'idle' | 'loading' | 'missing' | 'saved' | 'dirty' | 'saving' | 'conflict' | 'error';

export interface DocumentHandle<Doc> {
  id: string | undefined;
  /** The document with unsaved changes applied. `undefined` until loaded. */
  data: Doc | undefined;
  /** The stored revision the shown data builds on. */
  revision: number;
  status: DocumentStatus;
  error: string | null;
  /** Change the document. The change shows at once and is saved after a short pause. */
  update(change: (document: Doc) => Doc): void;
  /** Save pending changes now. */
  save(): Promise<void>;
  /**
   * Read the stored document again. A newer version replaces the shown data, or becomes a conflict
   * when changes are unsaved. A failed read keeps what is shown.
   */
  refresh(): Promise<void>;
  /** After a conflict: write your changes over the other writer's (`mine`), or drop yours (`theirs`). */
  resolveConflict(keep: 'mine' | 'theirs'): void;
}

export interface CollectionHandle<Doc> {
  documents: StoredDocument<Doc>[];
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  /** Whether more documents follow; load them with `loadMore`. */
  hasMore: boolean;
  loadMore(): Promise<void>;
  create(data: Doc, options?: { id?: string }): Promise<StoredDocument<Doc>>;
  remove(id: string): Promise<void>;
  refresh(): Promise<void>;
}

export type UseCollection = <C extends AnyCollection>(
  collection: C,
  query?: CollectionQuery<DocumentOf<C>>
) => CollectionHandle<DocumentOf<C>>;

export type UseDocument = <C extends AnyCollection>(collection: C, id: string | null | undefined) => DocumentHandle<DocumentOf<C>>;

// ---------------------------------------------------------------------------------------------
// Docs
// ---------------------------------------------------------------------------------------------

export interface DataResult<T> {
  data: T | undefined;
  status: 'loading' | 'ready' | 'error';
  error: string | null;
}

/** `groups` lists the groups of the items that pass `filter`, for a group picker; `search` does not change them. */
export type QueryDataResult<T> = DataResult<T[]> & { groups: string[] };

/**
 * The components that pass `query.filter` and match `query.search`. Narrow by group in the screen:
 * `data.filter((component) => component.group === group)`.
 */
export type UseComponents = (query?: ComponentQuery) => QueryDataResult<ComponentSummary>;

export type UseComponent = (id: string | null | undefined) => DataResult<ComponentInfo>;

/** Read a component outside render, such as in an event handler. Shares the cache with `useComponent`; `null` when it does not exist. */
export type LoadComponent = (id: string) => Promise<ComponentInfo | null>;

/** The patterns that pass `query.filter` and match `query.search`. */
export type UsePatterns = (query?: PatternQuery) => QueryDataResult<PatternInfo>;

/** Read any docs read API path, such as `tokens/foundations/colors.json`. */
export type UseDocsApi = <T = unknown>(path: string | null | undefined) => DataResult<T>;

// ---------------------------------------------------------------------------------------------
// Session and routing
// ---------------------------------------------------------------------------------------------

export interface ScreenSession {
  mode: 'workspace' | 'registry';
  /** The signed-in registry user. `null` in a workspace and when signed out. */
  user: { id: string; name: string | null; email: string | null; role: ScreenRole } | null;
  canRead: boolean;
  canWrite: boolean;
  status: 'loading' | 'ready';
}

export type UseSession = () => ScreenSession;

export interface ScreenRoute {
  screenId: string;
  /** Path segments after the screen's own route: `/screens/notes/a/b` gives `['a', 'b']`. */
  params: string[];
  navigate(params: string[], options?: { replace?: boolean }): void;
  /** The app path of a screen path, for the docs app's router. It leaves out the app base path. */
  href(params: string[]): string;
  /** The full URL of a screen path, for a link to send or to open in a new tab. Call it in the browser, such as in an event handler. */
  url(params: string[]): string;
}

export type UseScreenRoute = () => ScreenRoute;

/** The screen's options with schema defaults filled. Pass the default export of `options.ts`; it types the result. */
export type UseScreenOptions = <D extends AnyScreenOptions>(definition: D) => OptionsOf<D>;

// ---------------------------------------------------------------------------------------------
// Previews
// ---------------------------------------------------------------------------------------------

export interface ComponentPreviewProps {
  /** Component id. */
  id: string;
  /** A named preview. Defaults to the first one. */
  previewKey?: string;
  /** A small, non-interactive rendering for a picker or a card. */
  thumbnail?: boolean;
  className?: string;
}

/** A component state a reader saved in a registry: the component id and complete args. */
export interface SavedCustomPreview {
  id: string;
  componentId: string;
  title: string;
  description?: string;
  args: Record<string, unknown>;
  /** `unsupported`: the published component has no client render shell. */
  status: 'ok' | 'needs-attention' | 'unsupported';
  issues: ArgsIssue[];
  /** The component's contract changed since the preview was saved. */
  contractChanged: boolean;
  createdBy: { id: string; name?: string } | null;
  updatedBy: { id: string; name?: string } | null;
  createdAt: string;
  updatedAt: string;
}

/** The custom previews readers saved for a component. Registry only; empty in a workspace. */
export type UseCustomPreviews = (componentId: string | null | undefined) => DataResult<SavedCustomPreview[]>;

export interface CustomPreviewProps {
  componentId: string;
  /** Custom preview id. */
  id: string;
  className?: string;
}

// ---------------------------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------------------------

export type Viewport = 'desktop' | 'mobile';

export interface CanvasRenderError {
  instanceId?: string;
  componentId?: string;
  message: string;
}

export interface ComponentCanvasProps {
  /** Rendered together in one sandboxed frame, stacked top to bottom in list order. */
  items: ComponentInstance[];
  /** `mobile` narrows the frame to 375px. @default 'desktop' */
  viewport?: Viewport;
  /** Scale of the frame, such as `0.7`. @default 1 */
  zoom?: number;
  selectedId?: string | null;
  /** Called with the instance a reader clicked in the frame. */
  onSelect?(instanceId: string): void;
  /** Shown instead of the frame when `items` is empty. */
  empty?: ReactNode;
  /**
   * `edit` frames the instances in a card, outlines each one and turns clicks into `onSelect`. `view`
   * fills the area with the instances alone, and clicks reach the components; links still do not leave
   * the frame. @default 'edit'
   */
  mode?: 'edit' | 'view';
  onRenderError?(error: CanvasRenderError): void;
  className?: string;
}

export interface ArgsFormProps {
  /** `ComponentInfo.contract`. */
  contract: ComponentContract;
  value: Record<string, unknown>;
  onChange(next: Record<string, unknown>): void;
  /** The top-level properties to show, in this order. Others are hidden and keep their values. Defaults to every property. */
  fields?: string[];
  disabled?: boolean;
}

/** Each instance checked against its component's current contract, keyed by instance id. */
export type AssessInstances = (items: ComponentInstance[]) => Promise<Record<string, InstanceAssessment>>;

export type UseInstanceAssessment = (items: ComponentInstance[]) => Record<string, InstanceAssessment>;

// ---------------------------------------------------------------------------------------------
// Layout and controls
// ---------------------------------------------------------------------------------------------

export interface ScreenLayoutProps {
  /** Toolbar content, left to right. */
  toolbar?: ReactNode;
  /** The left column, usually a `ScreenLayout.Panel`. */
  left?: ReactNode;
  /** Offer the assistant column with a toggle at the far right of the toolbar. */
  assistant?: boolean;
  children?: ReactNode;
}

export interface ScreenPanelProps {
  title: ReactNode;
  count?: number;
  /** Show a back chevron. The panel slides in. */
  onBack?(): void;
  /** Controls at the right of the header. */
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export interface ScreenStatusProps {
  /** A document handle; a conflict shows its resolve actions. */
  document?: Pick<DocumentHandle<unknown>, 'status' | 'error' | 'resolveConflict'>;
  state?: DocumentStatus;
}

export interface ScreenActionProps {
  /** An icon name, such as `trash-2`, or an element. */
  icon: string | ReactNode;
  label: string;
  onClick?(): void;
  active?: boolean;
  disabled?: boolean;
}

export type ScreenLayoutComponent = FC<ScreenLayoutProps> & {
  Panel: FC<ScreenPanelProps>;
  Status: FC<ScreenStatusProps>;
  /** A ghost icon button for the toolbar. */
  Action: FC<ScreenActionProps>;
  /** A vertical divider for the toolbar. */
  Divider: FC;
  /** Pushes the toolbar items after it to the right. */
  Spacer: FC;
};

export interface DocumentMenuProps<C extends AnyCollection> {
  collection: C;
  /** The open document id. */
  current?: string | null;
  /** Open a document; `null` when none is left. */
  onOpen(id: string | null): void;
  /** The field that holds a document's name. @default 'title' */
  titleField?: Extract<keyof DocumentOf<C>, string>;
  /** A new document from the name a reader typed. Defaults to the schema's empty document with that name. */
  create?(title: string): DocumentOf<C>;
  /** Open the first document when `current` is not set or no longer exists. @default true */
  autoOpen?: boolean;
  /** What one document is called in labels. @default 'document' */
  noun?: string;
}

export type DocumentMenuComponent = <C extends AnyCollection>(props: DocumentMenuProps<C>) => ReactElement | null;

export interface ViewportToggleProps {
  value: Viewport;
  onChange(value: Viewport): void;
  /** Show a zoom control. */
  zoom?: number;
  onZoomChange?(zoom: number): void;
  /** @default [1, 0.7] */
  zoomLevels?: number[];
}

/** Tell the assistant what the reader has open on this screen. Send ids and small values only. */
export type UseAssistantContext = (value: Record<string, unknown> | null | undefined) => void;

/**
 * Whether an event target is in the screen chrome: the parts the docs app draws around and on top of
 * the screen's content, which the screen cannot mark itself. These are the assistant column and the
 * dialogs, menus, lists and popovers open on top of the screen, including those of `ui`,
 * `DocumentMenu` and `ArgsForm`. Use it to ignore such events, for example when a click outside a
 * selection clears it.
 */
export type IsScreenChrome = (target: EventTarget | null) => boolean;

// ---------------------------------------------------------------------------------------------
// UI primitives
// ---------------------------------------------------------------------------------------------

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm';
}

export interface DialogProps {
  open?: boolean;
  onOpenChange?(open: boolean): void;
  children?: ReactNode;
}

export interface SortableHandle {
  /** Spread on the grip element. */
  props: HTMLAttributes<HTMLElement> & { 'aria-label': string };
  dragging: boolean;
}

export interface SortableListProps<T extends { id: string }> {
  items: T[];
  /** The items in their new order. */
  onReorder(items: T[]): void;
  renderItem(item: T, handle: SortableHandle, index: number): ReactNode;
  className?: string;
}

export interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** An icon name or element before the title. */
  icon?: string | ReactNode;
  selected?: boolean;
  /** A warning marker; its text shows as a tooltip. */
  warning?: string | null;
  /** Shown on hover and focus. */
  actions?: ReactNode;
  onClick?(): void;
  /** From `SortableList`: shows a grip. */
  handle?: SortableHandle;
  className?: string;
}

export interface SegmentedControlProps<V extends string> {
  value: V;
  // `NoInfer`: the value type comes from `value`, so a `useState` setter of a union fits `onChange`.
  onChange(value: NoInfer<V>): void;
  options: { value: NoInfer<V>; label: ReactNode; icon?: string; title?: string }[];
  className?: string;
}

/** A stable subset of the docs app's UI primitives. Their look follows the docs theme. */
export interface ScreenUi {
  Button: ComponentType<ButtonProps>;
  Input: ComponentType<InputHTMLAttributes<HTMLInputElement>>;
  Label: ComponentType<LabelHTMLAttributes<HTMLLabelElement>>;
  Badge: ComponentType<HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }>;
  Card: ComponentType<HTMLAttributes<HTMLDivElement>>;
  CardHeader: ComponentType<HTMLAttributes<HTMLDivElement>>;
  CardTitle: ComponentType<HTMLAttributes<HTMLDivElement>>;
  CardDescription: ComponentType<HTMLAttributes<HTMLDivElement>>;
  CardContent: ComponentType<HTMLAttributes<HTMLDivElement>>;
  CardFooter: ComponentType<HTMLAttributes<HTMLDivElement>>;
  Dialog: ComponentType<DialogProps>;
  DialogContent: ComponentType<HTMLAttributes<HTMLDivElement>>;
  DialogHeader: ComponentType<HTMLAttributes<HTMLDivElement>>;
  DialogFooter: ComponentType<HTMLAttributes<HTMLDivElement>>;
  DialogTitle: ComponentType<HTMLAttributes<HTMLHeadingElement>>;
  DialogDescription: ComponentType<HTMLAttributes<HTMLParagraphElement>>;
  Separator: ComponentType<{ orientation?: 'horizontal' | 'vertical'; className?: string }>;
  /** A responsive grid. `min` is the smallest column width in pixels. */
  Grid: ComponentType<HTMLAttributes<HTMLDivElement> & { min?: number }>;
  SearchInput: ComponentType<{
    value: string;
    onChange(value: string): void;
    placeholder?: string;
    autoFocus?: boolean;
    className?: string;
  }>;
  EmptyState: ComponentType<{
    title: ReactNode;
    description?: ReactNode;
    icon?: string | ReactNode;
    /** A callback shows a button labelled `actionLabel`. */
    action?: (() => void) | ReactNode;
    actionLabel?: string;
    className?: string;
  }>;
  /**
   * The loading spinner of the docs app, centered in its container. It shows only after a short
   * delay, so a fast load never flashes it. `label` is its accessible name (default "Loading").
   */
  Loading: ComponentType<{ label?: string; className?: string }>;
  /** A dashed, full-width add button for the end of a list. */
  AddButton: ComponentType<{ children?: ReactNode; onClick?(): void; disabled?: boolean; className?: string }>;
  SortableList: <T extends { id: string }>(props: SortableListProps<T>) => ReactElement;
  ListRow: ComponentType<ListRowProps>;
  SegmentedControl: <V extends string>(props: SegmentedControlProps<V>) => ReactElement;
  /** An icon by name, such as `notebook-pen`. An unknown name shows a neutral square. */
  Icon: ComponentType<{ name: string; className?: string }>;
}
