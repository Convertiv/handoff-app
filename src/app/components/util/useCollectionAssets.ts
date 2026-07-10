'use client';

import { useEffect, useState } from 'react';
import type { Types as CoreTypes } from 'handoff-core';
import type { AssetMetadata } from '@handoff/store';

/**
 * Client-side hydration for asset pages (icons grid, icon detail, logos). Asset routes are static, so
 * their `getStaticProps` data is build-time only (empty in a registry build). In registry mode these
 * hooks fetch the metadata-only list from the docs read API on mount (and, for detail, one SVG body),
 * so a publish surfaces without a rebuild; workspace/static returns the build-time props unchanged.
 */

const isRegistry = process.env.HANDOFF_RUNTIME_MODE === 'registry';
const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

/** A grid/detail-renderable asset: inline SVG body (workspace) or a content URL (registry). */
export interface DisplayableAsset {
  /** Stable id used for the detail route + sprite symbol. */
  icon: string;
  /** Searchable index string. */
  index: string;
  name: string;
  /** Logical path within the collection (registry) or the asset path (workspace). */
  path: string;
  size?: number;
  /** Optional asset description (logos). */
  description?: string;
  /** Inline SVG body (workspace, or a fetched single-asset body). */
  data?: string;
  /** Individual asset content URL (registry). */
  src?: string;
}

const contentUrl = (collection: string, logicalPath: string): string => `${basePath}/api/docs/assets/${collection}/${logicalPath}`;

const fromWorkspace = (assets?: CoreTypes.IAssetObject[]): DisplayableAsset[] =>
  (assets ?? []).map((asset) => ({
    icon: asset.icon,
    index: asset.index,
    name: asset.name,
    path: asset.path,
    size: asset.size,
    description: asset.description,
    data: asset.data,
  }));

/** Map registry metadata rows (individual assets only) to displayable assets. */
const fromRegistry = (collection: string, rows: AssetMetadata[]): DisplayableAsset[] => {
  const prefix = `assets/${collection}/`;
  return (rows ?? [])
    .filter((row) => typeof row.path === 'string' && row.path.startsWith(prefix))
    .map((row) => ({
      icon: (row.metadata?.icon as string) ?? row.path.slice(prefix.length).replace(/\.[^.]+$/, ''),
      index: (row.metadata?.index as string) ?? row.name ?? '',
      name: row.name,
      path: row.path,
      size: row.size,
      description: row.metadata?.description as string | undefined,
      src: contentUrl(collection, row.path),
    }));
};

/** Hydrate a collection's asset list (metadata only), used by the icon grid and logo views. */
export const useCollectionAssets = (collection: 'icons' | 'logos', initial?: CoreTypes.IAssetObject[]): DisplayableAsset[] => {
  const [assets, setAssets] = useState<DisplayableAsset[]>(() => fromWorkspace(initial));

  useEffect(() => {
    if (!isRegistry) {
      return;
    }
    let active = true;
    fetch(`${basePath}/api/docs/assets/${collection}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.assets) setAssets(fromRegistry(collection, data.assets));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [collection]);

  return assets;
};

/** Hydrate a single asset (with its SVG body) by id, used by the icon detail view. */
export const useSingleAsset = (
  collection: 'icons' | 'logos',
  iconId: string | undefined,
  initial?: CoreTypes.IAssetObject
): DisplayableAsset | null => {
  const [asset, setAsset] = useState<DisplayableAsset | null>(() =>
    initial
      ? { icon: initial.icon, index: initial.index, name: initial.name, path: initial.path, size: initial.size, data: initial.data }
      : null
  );

  useEffect(() => {
    if (!isRegistry || !iconId) {
      return;
    }
    let active = true;
    (async () => {
      const listRes = await fetch(`${basePath}/api/docs/assets/${collection}`);
      if (!listRes.ok) return;
      const data = await listRes.json();
      const entry = fromRegistry(collection, data?.assets ?? []).find((candidate) => candidate.icon === iconId);
      if (!entry) return;
      let body: string | undefined;
      try {
        const bodyRes = await fetch(entry.src as string);
        if (bodyRes.ok) body = await bodyRes.text();
      } catch {
        // Preview falls back to the <img> src if the body cannot be fetched.
      }
      if (active) setAsset({ ...entry, data: body });
    })().catch(() => {});
    return () => {
      active = false;
    };
  }, [collection, iconId]);

  return asset;
};
