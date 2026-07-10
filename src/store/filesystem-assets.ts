import crypto from 'crypto';
import fs from 'fs-extra';
import { Types as CoreTypes } from 'handoff-core';
import path from 'path';
import { resolveAssetPhysicalPath, type AssetPhysicalRoots } from '../registry/assets/layout';
import { ASSET_COLLECTIONS, assetContentType } from '../registry/assets/sets';
import type { FilesystemStoreContext } from './filesystem';
import type { AssetContentResource, AssetMetadata, AssetStore } from './types';

const sha256 = (bytes: Buffer): string => crypto.createHash('sha256').update(bytes).digest('hex');

interface AssetFileEntry {
  logicalPath: string;
  name: string;
  metadata?: Record<string, unknown> | null;
  absolutePath: string;
}

const isFile = (absolutePath: string): boolean => {
  try {
    return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile();
  } catch {
    return false;
  }
};

/**
 * Filesystem backed asset store. Enumerates each collection from the generated `public/api` tree
 * plus the downloadable ZIP and font archives.
 */
export class FilesystemAssetStore implements AssetStore {
  constructor(private readonly context: FilesystemStoreContext) {}

  private roots(): AssetPhysicalRoots | null {
    const apiPath = this.context.getAssetsApiPath?.();
    const iconsZip = this.context.getIconsZipFilePath?.();
    const logosZip = this.context.getLogosZipFilePath?.();
    const workingPath = this.context.workingPath;
    if (!apiPath || !iconsZip || !logosZip || !workingPath) {
      return null;
    }
    return { apiPath, iconsZip, logosZip, workingPath };
  }

  private enumerate(collection: string): AssetFileEntry[] {
    const roots = this.roots();
    if (!roots) {
      return [];
    }

    if (collection === 'icons' || collection === 'logos') {
      const entries: AssetFileEntry[] = [];
      const collectionJson = `assets/${collection}.json`;
      let assetObjects: CoreTypes.IAssetObject[] = [];
      try {
        const raw = fs.readFileSync(resolveAssetPhysicalPath(collectionJson, roots), 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) assetObjects = parsed as CoreTypes.IAssetObject[];
      } catch {
        assetObjects = [];
      }
      for (const asset of assetObjects) {
        const logicalPath = `assets/${collection}/${asset.path}`;
        entries.push({
          logicalPath,
          name: asset.name,
          metadata: { icon: asset.icon, index: asset.index, description: asset.description ?? null },
          absolutePath: resolveAssetPhysicalPath(logicalPath, roots),
        });
      }
      const extras =
        collection === 'icons'
          ? [collectionJson, 'icons-sprite.svg', 'icons-sprite-manifest.json', 'icons.zip']
          : [collectionJson, 'logos.zip'];
      for (const logicalPath of extras) {
        entries.push({ logicalPath, name: path.basename(logicalPath), absolutePath: resolveAssetPhysicalPath(logicalPath, roots) });
      }
      return entries.filter((entry) => isFile(entry.absolutePath));
    }

    if (collection === 'fonts') {
      const fontsDir = path.resolve(roots.workingPath, 'fonts');
      if (!fs.existsSync(fontsDir)) {
        return [];
      }
      try {
        return fs
          .readdirSync(fontsDir)
          .filter((file) => file.toLowerCase().endsWith('.zip'))
          .map((file) => ({ logicalPath: `fonts/${file}`, name: file, absolutePath: path.join(fontsDir, file) }))
          .filter((entry) => isFile(entry.absolutePath));
      } catch {
        return [];
      }
    }

    return [];
  }

  private toMetadata(collection: string, entry: AssetFileEntry, bytes: Buffer): AssetMetadata {
    return {
      collection,
      path: entry.logicalPath,
      name: entry.name,
      contentType: assetContentType(entry.logicalPath),
      size: bytes.length,
      contentHash: sha256(bytes),
      metadata: entry.metadata ?? null,
    };
  }

  listCollections(): string[] {
    return ASSET_COLLECTIONS.filter((collection) => this.enumerate(collection).length > 0);
  }

  listAssets(collection: string): AssetMetadata[] {
    const out: AssetMetadata[] = [];
    for (const entry of this.enumerate(collection)) {
      try {
        out.push(this.toMetadata(collection, entry, fs.readFileSync(entry.absolutePath)));
      } catch {
        // Skip files that vanished between enumeration and read.
      }
    }
    return out;
  }

  getAsset(collection: string, assetPath: string): AssetMetadata | null {
    const entry = this.enumerate(collection).find((candidate) => candidate.logicalPath === assetPath);
    if (!entry) {
      return null;
    }
    try {
      return this.toMetadata(collection, entry, fs.readFileSync(entry.absolutePath));
    } catch {
      return null;
    }
  }

  getAssetContent(collection: string, assetPath: string): AssetContentResource | null {
    const entry = this.enumerate(collection).find((candidate) => candidate.logicalPath === assetPath);
    if (!entry) {
      return null;
    }
    try {
      const bytes = fs.readFileSync(entry.absolutePath);
      return { ...this.toMetadata(collection, entry, bytes), body: bytes };
    } catch {
      return null;
    }
  }
}
