import { isCollection, isScreenOptions, type AnyCollection, type ScreenRole } from '@handoff/screens/define';
import {
  queryComponents,
  queryPatterns,
  resolvePatterns,
  toComponentInfo,
  toComponentSummary,
  type ComponentArtifactShape,
} from '@handoff/screens/catalog';
import { assessComponentArgs } from '@handoff/screens/instances';
import type { DocsReader, ScreenTool, ScreenToolsContext, ScreenToolsDefinition, ToolCaller } from '@handoff/screens/server';
import { createCollectionStore, type CollectionsBackend } from '@handoff/screens/store';
import type { ComponentInfo, PatternInfo } from '@handoff/screens/types';
import { screenServerModules } from '@/generated/screens.server';
import { readComponentArtifact } from '../docs-api/component-artifact';
import { resolveDocsBackend } from '../docs-api';
import { getServerRuntimeConfig } from '../docs-api/runtime-config';
import { findScreen, isScreenAvailable, type ScreenManifestEntry } from './manifest';
import { workspaceCollectionsBackend } from './workspace-backend';

/**
 * Server side of screens: their collections, who may use them, the docs they read and their tools.
 * Server-only. API routes and the MCP server import it; the browser never does, because
 * `@/generated/screens.server` compiles the workspace's `collections.ts` and `tools.ts`.
 */

/** Who acts. `null` in a workspace, which has one user and no roles. */
export type ScreenCaller = ToolCaller | null;

export interface ScreenPermissions {
  canRead: boolean;
  canWrite: boolean;
}

const isRegistry = (): boolean => getServerRuntimeConfig().mode === 'registry';

const roleAllows = (role: ScreenRole, required: ScreenRole): boolean => required === 'member' || role === 'admin';

/**
 * What a caller may do on a screen. A workspace applies no roles. A registry needs a signed-in
 * user with the screen's roles; `writeScope` is false for a token without a write scope.
 */
export const screenPermissions = (screen: ScreenManifestEntry, caller: ScreenCaller, writeScope = true): ScreenPermissions => {
  if (!isRegistry()) return { canRead: true, canWrite: true };
  if (!caller) return { canRead: false, canWrite: false };
  const canRead = roleAllows(caller.role, screen.access.read);
  return { canRead, canWrite: canRead && writeScope && roleAllows(caller.role, screen.access.write) };
};

/** A declared screen that this build serves. */
export const findServedScreen = (id: string | undefined): ScreenManifestEntry | undefined => {
  const screen = findScreen(id);
  return screen && isScreenAvailable(screen) ? screen : undefined;
};

export const screenCollections = (screenId: string): AnyCollection[] =>
  Object.values(screenServerModules[screenId]?.collections ?? {}).filter(isCollection);

export const findCollection = (screenId: string, name: string): AnyCollection | undefined =>
  screenCollections(screenId).find((collection) => collection.name === name);

let registryBackend: Promise<CollectionsBackend> | null = null;

/** The collections backing for this mode. The registry one loads lazily, so a workspace never loads the database packages. */
export const resolveCollectionsBackend = async (): Promise<CollectionsBackend> => {
  if (!isRegistry()) return workspaceCollectionsBackend;
  registryBackend ??= Promise.all([import('../registry-connection'), import('@handoff/registry/screen-documents')])
    .then(async ([{ getRegistryConnection }, { createRegistryCollectionsBackend }]) =>
      createRegistryCollectionsBackend((await getRegistryConnection()).db)
    )
    .catch((error) => {
      registryBackend = null;
      throw error;
    });
  return registryBackend;
};

export const createScreenStores = (
  screen: ScreenManifestEntry,
  backend: CollectionsBackend,
  caller: ScreenCaller,
  permissions: ScreenPermissions
): ScreenToolsContext['collections'] => ({
  get: (collection) => {
    if (!isCollection(collection) || !findCollection(screen.id, collection.name)) {
      throw new Error(`Collection "${(collection as AnyCollection)?.name}" does not belong to screen "${screen.id}".`);
    }
    return createCollectionStore(collection, {
      backend,
      ownerKind: 'screen',
      ownerId: screen.id,
      actor: caller?.userId ?? null,
      canWrite: permissions.canWrite,
    });
  },
});

/** Options for the screen's tools. `definition` only types the result; the build baked the values. */
export const screenOptions = (screen: ScreenManifestEntry): ScreenToolsContext['options'] => ({
  get: (definition) => {
    if (!isScreenOptions(definition)) throw new Error(`options.get() needs the default export of the options.ts of screen "${screen.id}".`);
    return screen.options as never;
  },
});

/** Docs reads for tools, through the same mode-aware backing as `/api/docs/*`. */
export const createDocsReader = (): DocsReader => {
  const components = new Map<string, Promise<ComponentInfo | null>>();
  const component = (id: string): Promise<ComponentInfo | null> => {
    if (!components.has(id)) {
      components.set(
        id,
        resolveDocsBackend().then(async (backend) => {
          const artifact = await readComponentArtifact(backend, id);
          if (artifact) return toComponentInfo({ ...(artifact as unknown as ComponentArtifactShape), id });
          const record = await backend.getComponentDetail(id);
          return record ? toComponentInfo(record as unknown as ComponentArtifactShape) : null;
        })
      );
    }
    return components.get(id)!;
  };

  const patternList = async (): Promise<PatternInfo[]> => resolvePatterns(await (await resolveDocsBackend()).listPatterns(), component);

  return {
    component,
    async components(query = {}) {
      const records = await (await resolveDocsBackend()).listComponents();
      return queryComponents(
        records.map((record) => toComponentSummary(record as unknown as ComponentArtifactShape)),
        query
      ).items;
    },
    async pattern(id) {
      return (await patternList()).find((pattern) => pattern.id === id) ?? null;
    },
    async patterns(query = {}) {
      return queryPatterns(await patternList(), query).items;
    },
    assessArgs: (info, args) => assessComponentArgs(info.contract, args ?? {}),
  };
};

/** The tools a screen declared in `tools.ts`, created for one caller. */
export const declaredScreenTools = (screenId: string, context: ScreenToolsContext): ScreenTool[] => {
  const definition = screenServerModules[screenId]?.tools as ScreenToolsDefinition | undefined;
  if (definition?.kind !== 'handoff-screen-tools') return [];
  return definition.create(context).filter((tool) => tool?.kind === 'handoff-tool');
};
