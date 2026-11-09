import type { CustomPreview } from '@handoff/custom-previews';

const basePath = (): string => process.env.HANDOFF_APP_BASE_PATH ?? '';

export const customPreviewsEnabled = (): boolean => process.env.HANDOFF_RUNTIME_MODE === 'registry';

export const customPreviewListUrl = (componentId: string): string =>
  `${basePath()}/api/docs/components/${encodeURIComponent(componentId)}/custom-previews`;

export const customPreviewUrl = (componentId: string, id: string): string => `${customPreviewListUrl(componentId)}/${encodeURIComponent(id)}`;

export const customPreviewRenderUrl = (componentId: string, id: string): string => `${customPreviewUrl(componentId, id)}/render`;

// Routes have no base path: `Link` and the router add it.
export const componentRoute = (componentId: string): string => `/system/component/${encodeURIComponent(componentId)}`;

export const customPreviewEditorRoute = (componentId: string, id: string | null, from?: string): string => {
  const route = `${componentRoute(componentId)}/previews/${id ? encodeURIComponent(id) : 'new'}`;
  return from ? `${route}?from=${encodeURIComponent(from)}` : route;
};

const customPreviewWriteUrl = (id?: string): string => `${basePath()}/api/custom-previews${id ? `/${encodeURIComponent(id)}` : ''}`;

export const saveCustomPreview = async (id: string | null, body: Record<string, unknown>, failure: string): Promise<CustomPreview> => {
  const response = await fetch(customPreviewWriteUrl(id ?? undefined), {
    method: id ? 'PATCH' : 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response, failure));
  return ((await response.json()) as { customPreview: CustomPreview }).customPreview;
};

export const deleteCustomPreview = async (id: string): Promise<void> => {
  const response = await fetch(customPreviewWriteUrl(id), { method: 'DELETE', credentials: 'include' });
  if (!response.ok) throw new Error(await readError(response, 'The custom preview could not be deleted.'));
};

export const readError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const body = await response.json();
    if (typeof body?.error === 'string') return body.error;
    if (typeof body?.error?.message === 'string') return body.error.message;
  } catch {
    /* empty */
  }
  return fallback;
};

export type { CustomPreview };
