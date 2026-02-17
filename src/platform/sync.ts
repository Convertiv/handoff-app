import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { Logger } from '../utils/logger';
import {
  createPush,
  CreatePushResult,
  downloadFile,
  getManifest,
  ManifestFile,
  pushChanges,
  PushResult
} from './client';

// ── Types ───────────────────────────────────────────────────────────────

export interface SyncState {
  version: number;
  manifest: Record<string, ManifestFile>;
  lastSync: string;
}

export interface PullResult {
  downloaded: string[];
  deleted: string[];
  unchanged: string[];
  version: number;
}

export interface PushDiff {
  added: string[];
  modified: string[];
  deleted: string[];
}

// ── Constants ───────────────────────────────────────────────────────────

const SYNC_STATE_DIR = '.handoff';
const SYNC_STATE_FILE = 'sync-state.json';

/** Paths excluded from sync (matching server-side exclusions) */
const EXCLUDED_PATTERNS = [
  '.env',
  'node_modules',
  'out',
  '.handoff',
  '.git',
  '.DS_Store',
];

// ── Sync State ──────────────────────────────────────────────────────────

/**
 * Load the sync state from the project directory.
 * Returns null if no sync state exists (first sync).
 */
export function loadSyncState(projectDir: string): SyncState | null {
  const stateFile = path.join(projectDir, SYNC_STATE_DIR, SYNC_STATE_FILE);
  try {
    if (fs.existsSync(stateFile)) {
      return fs.readJsonSync(stateFile) as SyncState;
    }
  } catch (err) {
    Logger.warn('Could not read sync state file.');
    Logger.debug('Sync state read error', err);
  }
  return null;
}

/**
 * Save the sync state to the project directory.
 */
export function saveSyncState(projectDir: string, state: SyncState): void {
  const stateDir = path.join(projectDir, SYNC_STATE_DIR);
  const stateFile = path.join(stateDir, SYNC_STATE_FILE);
  fs.ensureDirSync(stateDir);
  fs.writeJsonSync(stateFile, state, { spaces: 2 });
}

// ── Pull ────────────────────────────────────────────────────────────────

/**
 * Pull files from the remote project to the local directory.
 *
 * Compares the remote manifest against local files (using MD5 hashes)
 * and downloads any files that differ or are missing locally.
 *
 * @param onProgress Optional callback for reporting progress
 */
export async function pullProject(
  baseUrl: string,
  token: string,
  projectId: string,
  projectDir: string,
  options: {
    force?: boolean;
    onProgress?: (message: string) => void;
  } = {}
): Promise<PullResult> {
  const { force = false, onProgress } = options;

  onProgress?.('Fetching remote manifest...');
  const manifest = await getManifest(baseUrl, token, projectId);
  const remoteFiles = manifest.files;

  const downloaded: string[] = [];
  const deleted: string[] = [];
  const unchanged: string[] = [];

  // Download new or changed files
  const remoteKeys = Object.keys(remoteFiles);
  const total = remoteKeys.length;

  for (let i = 0; i < total; i++) {
    const relativePath = remoteKeys[i];
    const remoteEntry = remoteFiles[relativePath];
    const localPath = path.join(projectDir, relativePath);

    onProgress?.(`Checking (${i + 1}/${total}): ${relativePath}`);

    let needsDownload = false;

    if (!fs.existsSync(localPath)) {
      needsDownload = true;
    } else if (force) {
      needsDownload = true;
    } else {
      // Compare ETags (MD5 hash)
      const localHash = computeEtag(localPath);
      const remoteEtag = normalizeEtag(remoteEntry.etag);
      if (localHash !== remoteEtag) {
        needsDownload = true;
      }
    }

    if (needsDownload) {
      onProgress?.(`Downloading (${i + 1}/${total}): ${relativePath}`);
      const content = await downloadFile(baseUrl, token, projectId, relativePath);
      fs.ensureDirSync(path.dirname(localPath));
      fs.writeFileSync(localPath, content);
      downloaded.push(relativePath);
    } else {
      unchanged.push(relativePath);
    }
  }

  // Detect local files that no longer exist remotely
  const localFiles = walkDirectory(projectDir);
  for (const localRelative of localFiles) {
    if (!remoteFiles[localRelative]) {
      if (force) {
        const localPath = path.join(projectDir, localRelative);
        fs.removeSync(localPath);
        deleted.push(localRelative);
      }
      // If not force, we leave orphaned local files alone
    }
  }

  // Save sync state
  saveSyncState(projectDir, {
    version: manifest.version,
    manifest: remoteFiles,
    lastSync: new Date().toISOString(),
  });

  return { downloaded, deleted, unchanged, version: manifest.version };
}

// ── Push ────────────────────────────────────────────────────────────────

/**
 * Compute the diff between local files and the last-known manifest.
 */
export function computePushDiff(projectDir: string): PushDiff {
  const syncState = loadSyncState(projectDir);
  const lastManifest = syncState?.manifest ?? {};
  const localFiles = walkDirectory(projectDir);

  const added: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];

  // Check local files against the manifest
  for (const relativePath of localFiles) {
    const localPath = path.join(projectDir, relativePath);
    const localEtag = computeEtag(localPath);
    const remoteEntry = lastManifest[relativePath];

    if (!remoteEntry) {
      added.push(relativePath);
    } else {
      const remoteEtag = normalizeEtag(remoteEntry.etag);
      if (localEtag !== remoteEtag) {
        modified.push(relativePath);
      }
    }
  }

  // Check for files in the manifest that no longer exist locally
  const localSet = new Set(localFiles);
  for (const remotePath of Object.keys(lastManifest)) {
    if (!localSet.has(remotePath)) {
      deleted.push(remotePath);
    }
  }

  return { added, modified, deleted };
}

/**
 * Push local changes to the remote project.
 *
 * @param onProgress Optional callback for reporting progress
 */
export async function pushProject(
  baseUrl: string,
  token: string,
  projectId: string,
  projectDir: string,
  options: {
    force?: boolean;
    onProgress?: (message: string) => void;
  } = {}
): Promise<PushResult> {
  const { onProgress } = options;

  const syncState = loadSyncState(projectDir);
  const baseVersion = syncState?.version ?? 0;

  onProgress?.('Computing changes...');
  const diff = computePushDiff(projectDir);

  const changedPaths = [...diff.added, ...diff.modified];

  if (changedPaths.length === 0 && diff.deleted.length === 0) {
    onProgress?.('No changes to push.');
    return {
      success: true,
      version: baseVersion,
      uploaded: [],
      deleted: [],
      errors: [],
      files: syncState?.manifest ?? {},
    };
  }

  // For any changed file inside a component directory, also include the
  // component config file (e.g. button/button.js) so the server always
  // has the config context even if only other files in the dir changed.
  const configExtras = getComponentConfigsForChangedPaths(projectDir, changedPaths);
  for (const extra of configExtras) {
    if (!changedPaths.includes(extra)) {
      changedPaths.push(extra);
    }
  }

  onProgress?.(`Preparing ${changedPaths.length} file(s) to upload, ${diff.deleted.length} to delete...`);

  // Read file contents into buffers
  const files = new Map<string, Buffer>();
  for (const filePath of changedPaths) {
    const localPath = path.join(projectDir, filePath);
    files.set(filePath, fs.readFileSync(localPath));
  }

  onProgress?.('Pushing changes...');
  const result = await pushChanges(baseUrl, token, projectId, baseVersion, files, diff.deleted);

  // Update sync state with new version and manifest
  saveSyncState(projectDir, {
    version: result.version,
    manifest: result.files,
    lastSync: new Date().toISOString(),
  });

  return result;
}

// ── Create Push (New Project) ───────────────────────────────────────────

/**
 * Push an entire local project to the platform as a new project.
 * Collects all syncable local files and sends them via the create-push
 * endpoint, which creates the project and uploads files in one request.
 *
 * @param onProgress Optional callback for reporting progress
 */
export async function createPushProject(
  baseUrl: string,
  token: string,
  orgId: string,
  projectDir: string,
  options: {
    name?: string;
    figmaProjectId?: string;
    onProgress?: (message: string) => void;
  } = {}
): Promise<CreatePushResult> {
  const { onProgress } = options;

  onProgress?.('Scanning local files...');
  const localFiles = walkDirectory(projectDir);

  onProgress?.(`Preparing ${localFiles.length} file(s) for upload...`);

  const files = new Map<string, Buffer>();
  for (const relativePath of localFiles) {
    const localPath = path.join(projectDir, relativePath);
    files.set(relativePath, fs.readFileSync(localPath));
  }

  onProgress?.('Uploading project to platform...');
  const result = await createPush(baseUrl, token, orgId, files, {
    name: options.name,
    figmaProjectId: options.figmaProjectId,
  });

  // Save sync state so subsequent push/pull commands work correctly
  saveSyncState(projectDir, {
    version: result.syncVersion,
    manifest: result.files,
    lastSync: new Date().toISOString(),
  });

  return result;
}

// ── File Utilities ──────────────────────────────────────────────────────

/**
 * Recursively walk a directory and return relative file paths,
 * excluding patterns that should not be synced.
 */
export function walkDirectory(baseDir: string): string[] {
  const results: string[] = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      // Check exclusions against the first path segment and the entry name
      if (isExcluded(relativePath)) continue;

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        // Use forward slashes for consistency with the server
        results.push(relativePath.split(path.sep).join('/'));
      }
    }
  }

  walk(baseDir);
  return results;
}

/**
 * Check if a relative path should be excluded from sync.
 */
function isExcluded(relativePath: string): boolean {
  const segments = relativePath.split(path.sep);
  for (const pattern of EXCLUDED_PATTERNS) {
    // Match if any segment starts with or equals the pattern
    if (segments.some((seg) => seg === pattern || seg.startsWith(pattern + '/'))) {
      return true;
    }
    // Also match the exact relative path
    if (relativePath === pattern) return true;
  }
  return false;
}

/**
 * Compute the MD5 hash of a file (to compare against S3 ETags).
 */
function computeEtag(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Normalize an ETag string by removing surrounding quotes.
 */
function normalizeEtag(etag: string): string {
  return etag.replace(/^"/, '').replace(/"$/, '');
}

/** Config file extensions to look for in component directories. */
const COMPONENT_CONFIG_EXTENSIONS = ['.js', '.cjs', '.json'];

/**
 * For a list of changed file paths, find any component config files that
 * live in the same directory so they are always uploaded alongside changes.
 *
 * A "component config" is a file whose basename (without extension) matches
 * the containing directory name, e.g. `components/button/button.js`.
 */
function getComponentConfigsForChangedPaths(projectDir: string, changedPaths: string[]): string[] {
  const extras = new Set<string>();
  const checkedDirs = new Set<string>();

  for (const relativePath of changedPaths) {
    // Get the directory portion using forward-slash splitting (paths are
    // normalized to forward slashes by walkDirectory)
    const dirPart = relativePath.includes('/') ? relativePath.substring(0, relativePath.lastIndexOf('/')) : '';
    if (!dirPart || checkedDirs.has(dirPart)) continue;
    checkedDirs.add(dirPart);

    // The component config file is named after the directory
    const dirName = dirPart.includes('/') ? dirPart.substring(dirPart.lastIndexOf('/') + 1) : dirPart;

    for (const ext of COMPONENT_CONFIG_EXTENSIONS) {
      const configRelative = `${dirPart}/${dirName}${ext}`;
      const configAbsolute = path.join(projectDir, configRelative);
      if (fs.existsSync(configAbsolute)) {
        extras.add(configRelative);
        break; // only need the first matching config
      }
    }
  }

  return Array.from(extras);
}
