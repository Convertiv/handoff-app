'use client';

import * as React from 'react';

import { customPreviewListUrl, customPreviewsEnabled, type CustomPreview } from './api';
import { onCustomPreviewChange } from './events';

// A grouped page mounts one card per group, so concurrent loads share one request.
const requests = new Map<string, Promise<CustomPreview[]>>();

const loadCustomPreviews = (componentId: string): Promise<CustomPreview[]> => {
  const pending = requests.get(componentId);
  if (pending) return pending;
  const request = fetch(customPreviewListUrl(componentId), { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : { customPreviews: [] }))
    .then((body: { customPreviews?: CustomPreview[] }) => body.customPreviews ?? [])
    .catch((): CustomPreview[] => [])
    .finally(() => {
      if (requests.get(componentId) === request) requests.delete(componentId);
    });
  requests.set(componentId, request);
  return request;
};

export const useCustomPreviews = (componentId: string | undefined): CustomPreview[] => {
  const [previews, setPreviews] = React.useState<CustomPreview[]>([]);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    if (!componentId || !customPreviewsEnabled()) return;
    let cancelled = false;
    void loadCustomPreviews(componentId).then((next) => {
      if (!cancelled) setPreviews(next);
    });
    return () => {
      cancelled = true;
    };
  }, [componentId, version]);

  React.useEffect(() => {
    if (!componentId || !customPreviewsEnabled()) return;
    return onCustomPreviewChange((change) => {
      if (change.componentId === componentId) setVersion((value) => value + 1);
    });
  }, [componentId]);

  return previews;
};
