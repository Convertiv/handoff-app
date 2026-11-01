import {
  assessArgs,
  contractFingerprint,
  CustomPreviewInputError,
  parseArgs,
  parseDescription,
  parseTitle,
  RENDER_PROPS_SCRIPT_ID,
  scriptSafeJson,
  toArgsSchema,
  type ComponentContract,
  type CustomPreview,
  type JsonSchema,
} from '@handoff/custom-previews';
import {
  deleteCustomPreviewRow,
  getCustomPreviewRow,
  insertCustomPreviewRow,
  listCustomPreviewRows,
  updateCustomPreviewRow,
  type CustomPreviewRow,
} from '@handoff/registry/custom-previews';
import type { RegistryUserRole } from '@handoff/registry/auth';
import type { RegistryDatabase } from '@handoff/registry/db/client';
import type { TransformComponentTokensResult } from '@handoff/transformers/preview/types';
import type { DocsBackend } from '../docs-api/backend';
import { validateArtifactSegments } from '../docs-api/artifacts';
import { readComponentArtifact } from '../docs-api/component-artifact';
import type { ComponentDetail } from '../docs-api/records';

export interface CustomPreviewActor {
  userId: string;
  role: RegistryUserRole;
}

export type CustomPreviewErrorCode = 'not_found' | 'forbidden' | 'invalid';

export class CustomPreviewError extends Error {
  constructor(
    readonly code: CustomPreviewErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'CustomPreviewError';
  }
}

export interface ComponentContractInfo {
  id: string;
  title: string;
  contract: ComponentContract;
  renderPath?: string;
}

export const componentContractInfo = (record: ComponentDetail, artifact: TransformComponentTokensResult | null): ComponentContractInfo => ({
  id: record.id,
  title: record.title,
  contract: artifact?.properties ?? record.properties ?? {},
  // Artifacts built before custom previews have no render shell.
  renderPath: artifact?.customPreview?.renderUrl || undefined,
});

const loadComponentContract = async (backend: DocsBackend, id: string): Promise<ComponentContractInfo | null> => {
  const record = await backend.getComponentDetail(id);
  return record ? componentContractInfo(record, await readComponentArtifact(backend, id)) : null;
};

export const argsSchemaFor = (component: ComponentContractInfo): JsonSchema => toArgsSchema(component.contract);

const toCustomPreview = (row: CustomPreviewRow, component: ComponentContractInfo): CustomPreview => {
  const assessment = assessArgs(component.contract, row.args);
  const author = (user: CustomPreviewRow['createdBy']) => (user ? { id: user.id, name: user.name ?? undefined } : null);
  return {
    id: row.id,
    componentId: row.componentId,
    title: row.title,
    description: row.description ?? undefined,
    args: row.args,
    status: component.renderPath ? assessment.status : 'unsupported',
    issues: assessment.issues,
    contractChanged: row.contractFingerprint !== contractFingerprint(component.contract),
    createdBy: author(row.createdBy),
    updatedBy: author(row.updatedBy),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
};

const requireComponent = async (backend: DocsBackend, componentId: string): Promise<ComponentContractInfo> => {
  const component = await loadComponentContract(backend, componentId);
  if (!component) throw new CustomPreviewError('not_found', `Component "${componentId}" was not found.`);
  return component;
};

/** A row whose component is no longer published counts as missing; it returns when the component is republished. */
const requireRow = async (
  db: RegistryDatabase,
  backend: DocsBackend,
  id: string
): Promise<{ row: CustomPreviewRow; component: ComponentContractInfo }> => {
  const row = await getCustomPreviewRow(db, id);
  const component = row ? await loadComponentContract(backend, row.componentId) : null;
  if (!row || !component) throw new CustomPreviewError('not_found', `Custom preview "${id}" was not found.`);
  return { row, component };
};

const canModify = (actor: CustomPreviewActor, createdBy: { id: string } | null): boolean =>
  actor.role === 'admin' || (createdBy !== null && createdBy.id === actor.userId);

const assertCanModify = (actor: CustomPreviewActor, row: CustomPreviewRow): void => {
  if (!canModify(actor, row.createdBy)) {
    throw new CustomPreviewError('forbidden', 'Only the author or an administrator can change this custom preview.');
  }
};

const parsed = <T>(parse: () => T): T => {
  try {
    return parse();
  } catch (error) {
    if (error instanceof CustomPreviewInputError) throw new CustomPreviewError('invalid', error.message);
    throw error;
  }
};

export const listCustomPreviewsOf = async (db: RegistryDatabase, component: ComponentContractInfo): Promise<CustomPreview[]> => {
  const rows = await listCustomPreviewRows(db, component.id);
  return rows.map((row) => toCustomPreview(row, component));
};

export const listCustomPreviews = async (db: RegistryDatabase, backend: DocsBackend, componentId: string): Promise<CustomPreview[]> =>
  listCustomPreviewsOf(db, await requireComponent(backend, componentId));

export const getCustomPreview = async (
  db: RegistryDatabase,
  backend: DocsBackend,
  id: string
): Promise<{ preview: CustomPreview; component: ComponentContractInfo }> => {
  const { row, component } = await requireRow(db, backend, id);
  return { preview: toCustomPreview(row, component), component };
};

export interface CreateCustomPreviewInput {
  componentId: unknown;
  title: unknown;
  description?: unknown;
  args: unknown;
}

export const createCustomPreview = async (
  db: RegistryDatabase,
  backend: DocsBackend,
  actor: CustomPreviewActor,
  input: CreateCustomPreviewInput
): Promise<CustomPreview> => {
  if (typeof input.componentId !== 'string' || !input.componentId) {
    throw new CustomPreviewError('invalid', '`componentId` is required.');
  }
  const component = await requireComponent(backend, input.componentId);
  if (!component.renderPath) {
    throw new CustomPreviewError(
      'invalid',
      `Component "${component.id}" was published without a client render shell. Republish it to enable custom previews.`
    );
  }
  const row = await insertCustomPreviewRow(db, {
    componentId: component.id,
    title: parsed(() => parseTitle(input.title)),
    description: parsed(() => parseDescription(input.description)),
    args: parsed(() => parseArgs(input.args)),
    contractFingerprint: contractFingerprint(component.contract),
    userId: actor.userId,
  });
  return toCustomPreview(row, component);
};

export interface UpdateCustomPreviewInput {
  title?: unknown;
  description?: unknown;
  args?: unknown;
}

export const updateCustomPreview = async (
  db: RegistryDatabase,
  backend: DocsBackend,
  actor: CustomPreviewActor,
  id: string,
  input: UpdateCustomPreviewInput
): Promise<CustomPreview> => {
  const { row, component } = await requireRow(db, backend, id);
  assertCanModify(actor, row);
  const args = input.args === undefined ? undefined : parsed(() => parseArgs(input.args));
  const updated = await updateCustomPreviewRow(db, id, {
    title: input.title === undefined ? undefined : parsed(() => parseTitle(input.title)),
    description: input.description === undefined ? undefined : parsed(() => parseDescription(input.description)),
    args,
    // Saving args accepts them against the current contract.
    contractFingerprint: args ? contractFingerprint(component.contract) : undefined,
    userId: actor.userId,
  });
  if (!updated) throw new CustomPreviewError('not_found', `Custom preview "${id}" was not found.`);
  return toCustomPreview(updated, component);
};

export const deleteCustomPreview = async (
  db: RegistryDatabase,
  backend: DocsBackend,
  actor: CustomPreviewActor,
  id: string
): Promise<{ id: string; componentId: string }> => {
  const { row } = await requireRow(db, backend, id);
  assertCanModify(actor, row);
  await deleteCustomPreviewRow(db, id);
  return { id, componentId: row.componentId };
};

// String substitution, not a build: the registry never compiles anything.
const injectRenderArgs = (shell: string, args: Record<string, unknown>): string => {
  const props = `<script id="${RENDER_PROPS_SCRIPT_ID}" type="application/json">${scriptSafeJson(args)}</script>`;
  const existing = new RegExp(`<script[^>]*id=["']${RENDER_PROPS_SCRIPT_ID}["'][^>]*>[\\s\\S]*?</script>`);
  if (existing.test(shell)) return shell.replace(existing, () => props);
  return shell.replace(/<\/head>/i, () => `${props}</head>`);
};

export const renderCustomPreviewDocument = async (
  db: RegistryDatabase,
  backend: DocsBackend,
  id: string,
  componentId: string
): Promise<{ html: string } | { missing: 'preview' | 'shell' }> => {
  const row = await getCustomPreviewRow(db, id);
  const component = row?.componentId === componentId ? await loadComponentContract(backend, componentId) : null;
  if (!row || !component) return { missing: 'preview' };
  const segments = component.renderPath ? validateArtifactSegments(component.renderPath.split('/')) : null;
  if (!segments?.ok) return { missing: 'shell' };
  const shell = await backend.resolveArtifact(segments.segments);
  if (!shell) return { missing: 'shell' };
  return { html: injectRenderArgs(shell.body.toString(), assessArgs(component.contract, row.args).renderArgs) };
};
