import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
// Not the auth barrel: it loads the registry database.
import { PREVIEWS_WRITE_SCOPE, REGISTRY_WRITE_SCOPE } from '@handoff/registry/auth/types';
import type { CustomPreview } from '@handoff/custom-previews';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import type { DocsBackend } from '../docs-api/backend';
import type { CustomPreviewActor } from '../custom-previews/service';
import { basePath, fail, ok, read } from './result';
import { defineTool, type McpPrincipal, type McpTool } from './tool';

const componentId = { type: 'string', description: 'Component id, as returned by handoff_search_components.' };
const customPreviewId = { type: 'string', description: 'Custom preview id, as returned by handoff_list_custom_previews.' };
const args = {
  type: 'object',
  description:
    'The complete props to render the component with, as JSON. Write them against `argsSchema` from ' +
    'handoff_get_component. Values must be JSON: functions and elements are not possible.',
};

const editorUrl = (preview: CustomPreview): string =>
  `${basePath()}/system/component/${encodeURIComponent(preview.componentId)}/previews/${encodeURIComponent(preview.id)}`;

const toResult = (preview: CustomPreview) => ({
  id: preview.id,
  componentId: preview.componentId,
  title: preview.title,
  description: preview.description,
  args: preview.args,
  status: preview.status,
  issues: preview.issues.length ? preview.issues : undefined,
  contractChanged: preview.contractChanged || undefined,
  author: preview.createdBy?.name ?? preview.createdBy?.id,
  url: editorUrl(preview),
});

type CustomPreviewService = typeof import('../custom-previews/service');

interface RegistryContext {
  db: RegistryDatabase;
  backend: DocsBackend;
  service: CustomPreviewService;
}

const withRegistry = (what: string, body: (registry: RegistryContext) => Promise<CallToolResult>): Promise<CallToolResult> =>
  read(what, async (backend) => {
    // Lazy, so a workspace never loads the registry database packages.
    const [{ getRegistryConnection }, service] = await Promise.all([
      import('../registry-connection'),
      import('../custom-previews/service'),
    ]);
    const { db } = await getRegistryConnection();
    try {
      return await body({ db, backend, service });
    } catch (error) {
      if (error instanceof service.CustomPreviewError) return fail(error.message);
      throw error;
    }
  });

/** Checks scope per call: one MCP request can batch many calls, and the request-level check covers only reading. */
const asWriter = async (
  principal: McpPrincipal,
  what: string,
  body: (registry: RegistryContext, actor: CustomPreviewActor) => Promise<CallToolResult>
): Promise<CallToolResult> => {
  if (!principal) {
    return fail('Saving a custom preview needs a registry user token. This credential does not belong to a user.');
  }
  if (!principal.scopes.includes(PREVIEWS_WRITE_SCOPE) && !principal.scopes.includes(REGISTRY_WRITE_SCOPE)) {
    return fail(`This credential does not include the ${PREVIEWS_WRITE_SCOPE} scope. Create a token with it in registry Account settings.`);
  }
  const actor = { userId: principal.userId, role: principal.role };
  return withRegistry(what, (registry) => body(registry, actor));
};

export const customPreviewTools: McpTool[] = [
  defineTool<{ componentId: string }>(
    {
      name: 'handoff_list_custom_previews',
      title: 'List custom previews',
      description:
        'The custom previews saved for a component: id, title, status and author. `status` is ' +
        '`needs-attention` when the args no longer match the component contract; read the preview to see why.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: { type: 'object', properties: { componentId }, required: ['componentId'] },
    },
    async ({ componentId: id }) =>
      withRegistry(`custom previews of component "${id}"`, async ({ db, backend, service }) => {
        const previews = await service.listCustomPreviews(db, backend, id);
        return ok({
          customPreviews: previews.map(toResult).map(({ id, title, status, author, url }) => ({ id, title, status, author, url })),
        });
      })
  ),

  defineTool<{ id: string }>(
    {
      name: 'handoff_get_custom_preview',
      title: 'Get custom preview',
      description:
        'One custom preview: its args, the issues found against the current component contract, and ' +
        '`argsSchema`, the contract to write args against.',
      annotations: { readOnlyHint: true, openWorldHint: false },
      inputSchema: { type: 'object', properties: { id: customPreviewId }, required: ['id'] },
    },
    async ({ id }) =>
      withRegistry(`custom preview "${id}"`, async ({ db, backend, service }) => {
        const { preview, component } = await service.getCustomPreview(db, backend, id);
        return ok({ ...toResult(preview), argsSchema: service.argsSchemaFor(component) });
      })
  ),

  defineTool<{ componentId: string; title: string; description?: string; args: Record<string, unknown> }>(
    {
      name: 'handoff_create_custom_preview',
      title: 'Create custom preview',
      description:
        'Save a new custom preview of a component, visible to every reader. Read the component with ' +
        'handoff_get_component first and write `args` against its `argsSchema`. The result lists any ' +
        '`issues` with the args; fix them with handoff_update_custom_preview. `url` opens it in the docs.',
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      inputSchema: {
        type: 'object',
        properties: {
          componentId,
          title: { type: 'string', description: 'Short name shown in the preview list, for example "Dark, large".' },
          description: { type: 'string', description: 'Optional. What this preview shows.' },
          args,
        },
        required: ['componentId', 'title', 'args'],
      },
    },
    async (input, { principal }) =>
      asWriter(principal, `a custom preview of component "${input.componentId}"`, async ({ db, backend, service }, actor) =>
        ok(toResult(await service.createCustomPreview(db, backend, actor, input)))
      )
  ),

  defineTool<{ id: string; title?: string; description?: string; args?: Record<string, unknown> }>(
    {
      name: 'handoff_update_custom_preview',
      title: 'Update custom preview',
      description:
        'Change a custom preview. `args` replaces the stored args whole, so pass every prop to keep. ' +
        'Only its author or an administrator can change it.',
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        type: 'object',
        properties: {
          id: customPreviewId,
          title: { type: 'string' },
          description: { type: 'string' },
          args,
        },
        required: ['id'],
      },
    },
    async ({ id, ...input }, { principal }) =>
      asWriter(principal, `custom preview "${id}"`, async ({ db, backend, service }, actor) =>
        ok(toResult(await service.updateCustomPreview(db, backend, actor, id, input)))
      )
  ),

  defineTool<{ id: string }>(
    {
      name: 'handoff_delete_custom_preview',
      title: 'Delete custom preview',
      description: 'Delete a custom preview for every reader. Only its author or an administrator can delete it.',
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: { type: 'object', properties: { id: customPreviewId }, required: ['id'] },
    },
    async ({ id }, { principal }) =>
      asWriter(principal, `custom preview "${id}"`, async ({ db, backend, service }, actor) =>
        ok({ deleted: await service.deleteCustomPreview(db, backend, actor, id) })
      )
  ),
].map((tool) => ({ ...tool, registryOnly: true }));
