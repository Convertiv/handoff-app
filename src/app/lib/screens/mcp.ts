import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
// Not the auth barrel: it loads the registry database.
import { PREVIEWS_WRITE_SCOPE, REGISTRY_WRITE_SCOPE } from '@handoff/registry/auth/types';
import type { AnyCollection } from '@handoff/screens/define';
import type { DocsReader, ScreenTool, ToolResult } from '@handoff/screens/server';
import { createCollectionStore, type CollectionsBackend } from '@handoff/screens/store';
import { ScreenDataError, type DocumentRef, type StoredDocument } from '@handoff/screens/types';
import type { McpPrincipal, McpTool } from '../mcp/tool';
import type { ChangedDocument } from './events';
import { screensManifest, type ScreenManifestEntry } from './manifest';
import {
  createDocsReader,
  createScreenStores,
  screenOptions,
  declaredScreenTools,
  findServedScreen,
  resolveCollectionsBackend,
  screenCollections,
  screenPermissions,
  type ScreenCaller,
  type ScreenPermissions,
} from './server';

/**
 * Screen tools on the MCP server, and so in the assistant.
 *
 * A collection with `mcp` gets generated tools, `<screen>_<collection>_<list|get|create|update|delete>`;
 * a screen's `tools.ts` adds its own, listed as `<screen>_<name>`. A `screen`-scoped tool is offered
 * only to a session whose page context is that screen; a `global` one to every session, external
 * MCP clients included. A caller sees only the tools its role lets it use.
 */

/** Result `_meta` key that lists the documents a tool wrote, so open screens refresh them. */
export const CHANGED_DOCUMENTS_META = 'handoff/changed-documents';

export type { ChangedDocument };

export const toolPrefix = (screenId: string): string => screenId.replace(/-/g, '_');

const documentResult = (document: StoredDocument<unknown>) => ({ id: document.id, revision: document.revision, data: document.data });

const generated = (
  collection: AnyCollection,
  input: Record<string, unknown>,
  tool: Omit<ScreenTool, 'kind' | 'scope' | 'inputSchema'>
): ScreenTool => ({
  kind: 'handoff-tool',
  scope: collection.mcp ? collection.mcp.scope : 'screen',
  inputSchema: { type: 'object', ...input } as ScreenTool['inputSchema'],
  ...tool,
});

/** The generated CRUD tools of one collection. */
const collectionTools = (
  screen: ScreenManifestEntry,
  collection: AnyCollection,
  backend: CollectionsBackend,
  caller: ScreenCaller,
  permissions: ScreenPermissions
): ScreenTool[] => {
  if (!collection.mcp) return [];
  const store = createCollectionStore<unknown>(collection, {
    backend,
    ownerKind: 'screen',
    ownerId: screen.id,
    actor: caller?.userId ?? null,
    canWrite: permissions.canWrite,
  });
  const what = `the "${collection.name}" collection of the "${screen.title}" screen`;
  const id = { type: 'string', description: `Document id, as returned by the ${collection.name}_list tool.` };
  const ok = (payload: unknown, changed: DocumentRef[] = []): ToolResult => ({
    kind: 'handoff-tool-result',
    isError: false,
    payload,
    changed,
  });

  const tools: ScreenTool[] = [
    generated(
      collection,
      {
        properties: {
          where: { type: 'object', description: 'Equality filters on top-level fields, such as {"status": "draft"}.' },
          limit: { type: 'integer', minimum: 1, maximum: 200 },
          cursor: { type: 'string', description: '`nextCursor` from the previous page.' },
        },
      },
      {
        name: `${collection.name}_list`,
        title: `List ${collection.name}`,
        description: `List the documents of ${what}: id, revision and data.`,
        readOnly: true,
        run: async (args) => {
          const { where, limit, cursor } = args as { where?: Record<string, never>; limit?: number; cursor?: string };
          const page = await store.list({ where, limit, cursor });
          return ok({ documents: page.documents.map(documentResult), nextCursor: page.nextCursor });
        },
      }
    ),
    generated(
      collection,
      { properties: { id }, required: ['id'] },
      {
        name: `${collection.name}_get`,
        title: `Get ${collection.name}`,
        description: `Read one document of ${what}.`,
        readOnly: true,
        run: async (args) => {
          const document = await store.get((args as { id: string }).id);
          return document
            ? ok(documentResult(document))
            : { ...ok(null), isError: true, payload: `Document "${(args as { id: string }).id}" does not exist.` };
        },
      }
    ),
  ];
  if (collection.mcp.readOnly || !permissions.canWrite) return tools;

  const data = { ...collection.schema, description: `The whole document, following this schema.` };
  return [
    ...tools,
    generated(
      collection,
      {
        properties: { data, id: { type: 'string', description: 'Optional id; a new one is generated when omitted.' } },
        required: ['data'],
      },
      {
        name: `${collection.name}_create`,
        title: `Create ${collection.name}`,
        description: `Create a document in ${what}.`,
        readOnly: false,
        run: async (args) => {
          const input = args as { data: unknown; id?: string };
          const document = await store.create(input.data, { id: input.id });
          return ok(documentResult(document), [document.ref]);
        },
      }
    ),
    generated(
      collection,
      {
        properties: {
          id,
          data,
          revision: { type: 'integer', minimum: 1, description: 'Write only if the document is still at this revision.' },
        },
        required: ['id', 'data'],
      },
      {
        name: `${collection.name}_update`,
        title: `Update ${collection.name}`,
        description: `Replace a document of ${what} with \`data\`. Read it first and send the whole document.`,
        readOnly: false,
        run: async (args) => {
          const input = args as { id: string; data: unknown; revision?: number };
          const document = await store.put(input.id, input.data, {
            revision: input.revision ?? (await store.get(input.id))?.revision ?? 0,
          });
          return ok(documentResult(document), [document.ref]);
        },
      }
    ),
    generated(
      collection,
      { properties: { id }, required: ['id'] },
      {
        name: `${collection.name}_delete`,
        title: `Delete ${collection.name}`,
        description: `Delete a document of ${what}.`,
        readOnly: false,
        run: async (args) => {
          const documentId = (args as { id: string }).id;
          const deleted = await store.remove(documentId);
          return ok({ deleted }, deleted ? [{ collection: collection.name, id: documentId, revision: 0 }] : []);
        },
      }
    ),
  ];
};

const toCallToolResult = (screenId: string, result: ToolResult): CallToolResult => {
  if (result.isError) return { isError: true, content: [{ type: 'text', text: String(result.payload) }] };
  const changed: ChangedDocument[] = result.changed.map((ref) => ({
    screen: screenId,
    collection: ref.collection,
    id: ref.id,
    revision: ref.revision,
  }));
  return {
    content: [{ type: 'text', text: JSON.stringify(result.payload ?? null) }],
    ...(changed.length > 0 ? { _meta: { [CHANGED_DOCUMENTS_META]: changed } } : {}),
  };
};

const toMcpTool = (screen: ScreenManifestEntry, tool: ScreenTool): McpTool => ({
  definition: {
    name: `${toolPrefix(screen.id)}_${tool.name}`,
    title: `${screen.title}: ${tool.title}`,
    description: tool.description,
    inputSchema: tool.inputSchema as McpTool['definition']['inputSchema'],
    annotations: { readOnlyHint: tool.readOnly, openWorldHint: false },
  },
  run: async (args) => {
    try {
      return toCallToolResult(screen.id, await tool.run(args));
    } catch (error) {
      if (error instanceof ScreenDataError) return { isError: true, content: [{ type: 'text', text: error.message }] };
      console.error(`Screen tool "${screen.id}/${tool.name}" failed.`, error);
      return { isError: true, content: [{ type: 'text', text: `The tool "${tool.name}" failed unexpectedly.` }] };
    }
  },
});

/** A registry write needs a write scope as well as the role; a read-only token cannot change screen data. */
const hasWriteScope = (principal: McpPrincipal): boolean =>
  !principal || principal.scopes.includes(REGISTRY_WRITE_SCOPE) || principal.scopes.includes(PREVIEWS_WRITE_SCOPE);

/**
 * The screen tools one MCP session offers. `screenId` is the screen of the assistant's page
 * context; without it only global tools are listed.
 */
export const createScreenMcpTools = async ({
  principal,
  screenId,
  isRegistry,
}: {
  principal: McpPrincipal;
  screenId?: string;
  isRegistry: boolean;
}): Promise<McpTool[]> => {
  // A registry credential that is not a user's has no role, so it reaches no screen.
  if (isRegistry && !principal) return [];
  const caller: ScreenCaller = principal ? { userId: principal.userId, role: principal.role } : null;
  const docs: DocsReader = createDocsReader();
  const tools: McpTool[] = [];

  for (const entry of screensManifest.screens) {
    const screen = findServedScreen(entry.id);
    if (!screen || (!screen.collections.length && !screen.tools.length)) continue;
    const scopes = screen.id === screenId ? ['screen', 'global'] : ['global'];
    const declaresGlobal =
      screen.tools.some((tool) => tool.scope === 'global') ||
      screen.collections.some((collection) => collection.mcp && collection.mcp.scope === 'global');
    if (screen.id !== screenId && !declaresGlobal) continue;

    const permissions = screenPermissions(screen, caller, hasWriteScope(principal));
    if (!permissions.canRead) continue;
    const backend = await resolveCollectionsBackend();
    const context = { collections: createScreenStores(screen, backend, caller, permissions), options: screenOptions(screen), docs, caller };
    const screenTools = [
      ...screenCollections(screen.id).flatMap((collection) => collectionTools(screen, collection, backend, caller, permissions)),
      ...declaredScreenTools(screen.id, context).filter((tool) => tool.readOnly || permissions.canWrite),
    ];
    tools.push(...screenTools.filter((tool) => scopes.includes(tool.scope)).map((tool) => toMcpTool(screen, tool)));
  }
  return tools;
};
