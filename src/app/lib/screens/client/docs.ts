'use client';

import { buildArtifactUrl } from '@handoff/artifacts/url';
import type {
  AssessInstances,
  DataResult,
  LoadComponent,
  SavedCustomPreview,
  UseComponent,
  UseComponents,
  UseCustomPreviews,
  UseDocsApi,
  UseInstanceAssessment,
  UsePatterns,
} from '@handoff/screens/client-api';
import {
  queryComponents,
  queryPatterns,
  resolvePatterns,
  toComponentInfo,
  toComponentSummary,
  type ComponentArtifactShape,
  type PatternRecordShape,
} from '@handoff/screens/catalog';
import type { ComponentInstance } from '@handoff/screens/define';
import { assessInstance } from '@handoff/screens/instances';
import type { ComponentInfo, ComponentSummary, InstanceAssessment, PatternInfo } from '@handoff/screens/types';
import * as React from 'react';
import { customPreviewListUrl, customPreviewsEnabled } from '../../../components/CustomPreview/api';
import { onCustomPreviewChange } from '../../../components/CustomPreview/events';

/**
 * Docs reads for screens. Each resource is fetched once per page load and shared by every
 * component that asks for it; the docs do not change while a reader works on a screen.
 */

const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

interface Resource<T> {
  result: DataResult<T>;
  promise: Promise<T> | null;
  listeners: Set<() => void>;
}

const resources = new Map<string, Resource<unknown>>();
const LOADING: DataResult<any> = { data: undefined, status: 'loading', error: null };

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error(response.status === 404 ? 'Not found.' : `The docs could not be read (${response.status}).`);
  return response.json() as Promise<T>;
};

const resourceOf = <T>(key: string): Resource<T> => {
  let resource = resources.get(key) as Resource<T> | undefined;
  if (!resource) {
    resource = { result: LOADING, promise: null, listeners: new Set() };
    resources.set(key, resource as Resource<unknown>);
  }
  return resource;
};

/** Load a resource once; later calls share the result. A failure is retried on the next call. */
const load = <T>(key: string, loader: () => Promise<T>): Promise<T> => {
  const resource = resourceOf<T>(key);
  if (resource.result.status === 'ready') return Promise.resolve(resource.result.data as T);
  resource.promise ??= loader()
    .then((data) => {
      resource.result = { data, status: 'ready', error: null };
      return data;
    })
    .catch((error: Error) => {
      resource.result = { data: undefined, status: 'error', error: error.message };
      throw error;
    })
    .finally(() => {
      resource.promise = null;
      resource.listeners.forEach((listener) => listener());
    });
  return resource.promise;
};

const invalidate = (key: string): void => {
  const resource = resources.get(key);
  if (!resource) return;
  resource.result = LOADING;
  resource.listeners.forEach((listener) => listener());
};

const useResource = <T>(key: string | null, loader: () => Promise<T>): DataResult<T> => {
  const resource = key ? resourceOf<T>(key) : null;
  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (!resource) return () => undefined;
      resource.listeners.add(listener);
      return () => resource.listeners.delete(listener);
    },
    [resource]
  );
  const result = React.useSyncExternalStore(
    subscribe,
    () => resource?.result ?? LOADING,
    () => LOADING
  );
  const loaderRef = React.useRef(loader);
  loaderRef.current = loader;
  React.useEffect(() => {
    if (key && resource?.result.status !== 'ready') load(key, () => loaderRef.current()).catch(() => undefined);
  }, [key, resource, result.status]);
  return key ? result : { data: undefined, status: 'ready', error: null };
};

// ---------------------------------------------------------------------------------------------

const loadComponentList = (): Promise<ComponentSummary[]> =>
  load('components', async () =>
    (await fetchJson<ComponentArtifactShape[]>(`${basePath}/api/docs/components.json`)).map(toComponentSummary)
  );

/** The component JSON as the build wrote it. `ComponentPreview` reads its preview documents from it. */
export const loadComponentArtifact = (id: string): Promise<ComponentArtifactShape> =>
  load(`component-artifact:${id}`, () => fetchJson<ComponentArtifactShape>(buildArtifactUrl(`component/${id}.json`, basePath)));

export const useComponentArtifact = (id: string | null | undefined): DataResult<ComponentArtifactShape> =>
  useResource(id ? `component-artifact:${id}` : null, () => loadComponentArtifact(id!));

export const loadComponentInfo = (id: string): Promise<ComponentInfo> =>
  load(`component:${id}`, async () => toComponentInfo({ ...(await loadComponentArtifact(id)), id }));

const loadPatterns = (): Promise<PatternInfo[]> =>
  load('patterns', async () =>
    resolvePatterns(await fetchJson<PatternRecordShape[]>(`${basePath}/api/docs/patterns.json`), (id) => loadComponentInfo(id))
  );

export const useComponents: UseComponents = (query = {}) => {
  const list = useResource('components', loadComponentList);
  const { search, filter } = query;
  return React.useMemo(() => {
    const { items, groups } = queryComponents(list.data ?? [], { search, filter });
    return { ...list, data: list.data && items, groups };
  }, [list, search, filter]);
};

export const loadComponent: LoadComponent = (id) => loadComponentInfo(id).catch(() => null);

export const useComponent: UseComponent = (id) => useResource(id ? `component:${id}` : null, () => loadComponentInfo(id!));

export const usePatterns: UsePatterns = (query = {}) => {
  const list = useResource('patterns', loadPatterns);
  const { search, filter } = query;
  return React.useMemo(() => {
    const { items, groups } = queryPatterns(list.data ?? [], { search, filter });
    return { ...list, data: list.data && items, groups };
  }, [list, search, filter]);
};

export const useDocsApi: UseDocsApi = <T>(path: string | null | undefined) =>
  useResource<T>(path ? `docs:${path}` : null, () => fetchJson<T>(`${basePath}/api/docs/${path!.replace(/^\/+/, '')}`));

export const useCustomPreviews: UseCustomPreviews = (componentId) => {
  const key = componentId && customPreviewsEnabled() ? `custom-previews:${componentId}` : null;
  React.useEffect(() => {
    if (!key) return;
    return onCustomPreviewChange((change) => {
      if (change.componentId === componentId) invalidate(key);
    });
  }, [key, componentId]);
  return useResource<SavedCustomPreview[]>(
    key,
    async () => (await fetchJson<{ customPreviews?: SavedCustomPreview[] }>(customPreviewListUrl(componentId!))).customPreviews ?? []
  );
};

// ---------------------------------------------------------------------------------------------

const assess = (items: ComponentInstance[], infos: Map<string, ComponentInfo | null>): Record<string, InstanceAssessment> =>
  Object.fromEntries(items.map((item) => [item.id, assessInstance(item, infos.get(item.componentId) ?? null)]));

const loadInfos = async (componentIds: string[]): Promise<Map<string, ComponentInfo | null>> =>
  new Map(await Promise.all(componentIds.map(async (id) => [id, await loadComponentInfo(id).catch(() => null)] as const)));

export const assessInstances: AssessInstances = async (items) =>
  assess(items, await loadInfos([...new Set(items.map((item) => item.componentId))]));

export const useInstanceAssessment: UseInstanceAssessment = (items) => {
  const [infos, setInfos] = React.useState<Map<string, ComponentInfo | null>>(new Map());
  const ids = [...new Set(items.map((item) => item.componentId))].sort().join('\n');
  React.useEffect(() => {
    let active = true;
    void loadInfos(ids ? ids.split('\n') : []).then((next) => active && setInfos(next));
    return () => {
      active = false;
    };
  }, [ids]);
  // Instances whose component has not loaded yet report nothing rather than a false warning.
  return React.useMemo(
    () =>
      assess(
        items.filter((item) => infos.has(item.componentId)),
        infos
      ),
    [items, infos]
  );
};
