/**
 * `handoff-app/screens/server`: assistant tools for screens. Import it only from a screen's
 * `tools.ts`; the build rejects it in UI code. Pure: it has no runtime dependencies, so a screen
 * never pulls the CLI into the app.
 */
import type { AnyCollection, DocumentOf, ToolScope } from './define';
import type { FromSchema, JsonObjectSchema } from './schema';
import type {
  ArgsAssessment,
  CollectionStore,
  ComponentInfo,
  ComponentQuery,
  ComponentSummary,
  DocumentRef,
  PatternInfo,
  PatternQuery,
} from './types';

export type { ToolScope } from './define';
export type { FromSchema, JsonObjectSchema, JsonSchema } from './schema';
export type {
  ArgsAssessment,
  ArgsIssue,
  CollectionPage,
  CollectionQuery,
  CollectionSort,
  CollectionStore,
  ComponentInfo,
  ComponentQuery,
  ComponentSummary,
  DocumentRef,
  PatternInfo,
  PatternQuery,
  StoredDocument,
} from './types';
export { ScreenDataError } from './types';
export { createInstance, createInstanceId, expandPattern, insertAfter, moveTo, type CreateInstanceOptions } from './instances';

/** What a tool reads from the design system. Reads go through the same backing as the docs. */
export interface DocsReader {
  /** `null` when the component does not exist. */
  component(id: string): Promise<ComponentInfo | null>;
  /** Components that pass `filter` and match `search`. Use the same `filter` as the screen's UI. */
  components(query?: ComponentQuery): Promise<ComponentSummary[]>;
  pattern(id: string): Promise<PatternInfo | null>;
  /** Patterns that pass `filter` and match `search`. */
  patterns(query?: PatternQuery): Promise<PatternInfo[]>;
  /** Check args against the component's current contract and fill defaults for required properties. */
  assessArgs(component: ComponentInfo, args: Record<string, unknown>): ArgsAssessment;
}

/** Who calls the tool. `null` in a workspace, which has one user. */
export interface ToolCaller {
  userId: string;
  role: 'member' | 'admin';
}

export interface ScreenToolsContext {
  /** Typed stores over this screen's collections. Writes act as the caller and check the screen's access. */
  collections: { get<C extends AnyCollection>(collection: C): CollectionStore<DocumentOf<C>> };
  docs: DocsReader;
  caller: ToolCaller | null;
}

export interface ToolResult {
  readonly kind: 'handoff-tool-result';
  readonly isError: boolean;
  readonly payload: unknown;
  /** Documents the tool wrote. Screens that show them refresh. */
  readonly changed: readonly DocumentRef[];
}

export interface ToolOptions<S extends JsonObjectSchema> {
  /** Unique within the screen. The listed name is `<screen>_<name>`. Letters, digits and `_`. */
  name: string;
  /** Short human label. Defaults to `name`. */
  title?: string;
  /** What the tool does and when to use it. The agent reads this. */
  description: string;
  /** @default 'screen' */
  scope?: ToolScope;
  /** Input as JSON Schema. The handler's argument type comes from it, and the server validates calls against it. */
  inputSchema: S;
  /** The tool changes nothing. @default false */
  readOnly?: boolean;
}

export interface ScreenTool {
  readonly kind: 'handoff-tool';
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly scope: ToolScope;
  readonly inputSchema: JsonObjectSchema;
  readonly readOnly: boolean;
  readonly run: (args: unknown) => Promise<ToolResult>;
}

export interface ScreenToolsDefinition {
  readonly kind: 'handoff-screen-tools';
  readonly create: (context: ScreenToolsContext) => ScreenTool[];
}

const TOOL_NAME = /^[a-z][a-z0-9_]{0,47}$/i;

/** A tool result. Pass `changed` with the refs of the documents the tool wrote. */
export const toolResult = (payload: unknown, options: { changed?: readonly DocumentRef[] } = {}): ToolResult => ({
  kind: 'handoff-tool-result',
  isError: false,
  payload,
  changed: options.changed ?? [],
});

/** A failed tool call. The agent reads the message, so say what to do instead. */
export const toolError = (message: string): ToolResult => ({ kind: 'handoff-tool-result', isError: true, payload: message, changed: [] });

/** Declare one tool. The handler's `args` are typed from `inputSchema` and already validated. */
export const defineTool = <const S extends JsonObjectSchema>(
  options: ToolOptions<S>,
  handler: (args: FromSchema<S>) => Promise<ToolResult> | ToolResult
): ScreenTool => {
  if (!TOOL_NAME.test(options.name ?? '')) {
    throw new Error(`Tool name "${options.name}" is invalid. Use letters, digits and "_", starting with a letter.`);
  }
  return {
    kind: 'handoff-tool',
    name: options.name,
    title: options.title ?? options.name,
    description: options.description,
    scope: options.scope ?? 'screen',
    inputSchema: options.inputSchema,
    readOnly: options.readOnly ?? false,
    run: async (args) => handler(args as FromSchema<S>),
  };
};

/**
 * The default export of a screen's `tools.ts`. The factory runs for each assistant or MCP session,
 * with stores that act as that session's caller.
 */
export const defineScreenTools = (create: (context: ScreenToolsContext) => ScreenTool[]): ScreenToolsDefinition => ({
  kind: 'handoff-screen-tools',
  create,
});
