import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../../index';
import { ComponentListObject, ComponentVersions, TransformComponentTokensResult } from '../types';

/**
 * Merges values from a source object into a target object, returning a new object.
 * For each key present in either object:
 *   - If the key is listed in preserveKeys and the source value is undefined, null, or an empty string,
 *     the target's value is preserved.
 *   - Otherwise, the value from the source is used (even if undefined, null, or empty string).
 * This is useful for partial updates where some properties should not be overwritten unless explicitly set.
 *
 * @param target - The original object to merge into
 * @param source - The object containing new values
 * @param preserveKeys - Keys for which the target's value should be preserved if the source value is undefined, null, or empty string
 * @returns A new object with merged values
 */
function updateObject<T extends TransformComponentTokensResult>(target: T, source: Partial<T>, preserveKeys: string[] = []): T {
  // Collect all unique keys from both target and source
  const allKeys = Array.from(new Set([...Object.keys(target), ...Object.keys(source)]));

  return allKeys.reduce(
    (acc, key) => {
      const sourceValue = source[key as keyof T];
      const targetValue = target[key as keyof T];

      // Preserve existing values for specified keys when source value is undefined
      if (preserveKeys.includes(key) && (sourceValue === undefined || sourceValue === null || sourceValue === '')) {
        acc[key as keyof T] = targetValue;
      } else {
        acc[key as keyof T] = sourceValue;
      }

      return acc;
    },
    { ...target }
  );
}

export const getAPIPath = (handoff: Handoff) => {
  const apiPath = path.resolve(handoff.workingPath, `public/api`);
  const componentPath = path.resolve(handoff.workingPath, `public/api/component`);
  // Ensure the public API path exists
  if (!fs.existsSync(componentPath)) {
    fs.mkdirSync(componentPath, { recursive: true });
  }
  return apiPath;
};

/**
 * Compute a hash of the component content (excluding metadata fields like hash, lastModified, version)
 * @param component The component data to hash
 * @returns SHA-256 hash of the component content
 */
const computeComponentHash = (component: TransformComponentTokensResult): string => {
  if (!component) return '';

  // Create a copy without metadata fields to ensure consistent hashing
  const { hash: _hash, lastModified: _lastModified, version: _version, ...contentToHash } = component;

  // Sort keys for consistent hashing
  const sortedJson = JSON.stringify(contentToHash, Object.keys(contentToHash).sort());
  return crypto.createHash('sha256').update(sortedJson).digest('hex');
};

/**
 * Get the path to the versions directory for a component
 */
const getVersionsPath = (handoff: Handoff, id: string): string => {
  return path.resolve(getAPIPath(handoff), 'component', id);
};

/**
 * Read the versions file for a component
 */
const readVersionsFile = async (handoff: Handoff, id: string): Promise<ComponentVersions | null> => {
  const versionsFilePath = path.resolve(getVersionsPath(handoff, id), 'versions.json');

  if (fs.existsSync(versionsFilePath)) {
    try {
      const content = await fs.readFile(versionsFilePath, 'utf8');
      return JSON.parse(content) as ComponentVersions;
    } catch {
      // Unable to parse versions file
    }
  }
  return null;
};

/**
 * Write the versions file for a component
 */
const writeVersionsFile = async (handoff: Handoff, id: string, versions: ComponentVersions): Promise<void> => {
  const versionsDir = getVersionsPath(handoff, id);

  if (!fs.existsSync(versionsDir)) {
    fs.mkdirSync(versionsDir, { recursive: true });
  }

  const versionsFilePath = path.resolve(versionsDir, 'versions.json');
  await fs.writeFile(versionsFilePath, JSON.stringify(versions, null, 2));
};

/**
 * Archive the old component JSON with a timestamp
 */
const archiveComponentVersion = async (
  handoff: Handoff,
  id: string,
  existingData: TransformComponentTokensResult,
  timestamp: string
): Promise<string> => {
  const versionsDir = getVersionsPath(handoff, id);

  if (!fs.existsSync(versionsDir)) {
    fs.mkdirSync(versionsDir, { recursive: true });
  }

  // Create filename with timestamp (ISO format cleaned for filesystem)
  const safeTimestamp = timestamp.replace(/[:.]/g, '-');
  const archiveFilename = `${id}.${safeTimestamp}.json`;
  const archiveFilePath = path.resolve(versionsDir, archiveFilename);

  await fs.writeFile(archiveFilePath, JSON.stringify(existingData, null, 2));

  return archiveFilename;
};

/**
 * Build the preview API from the component data
 * @param handoff
 * @param componentData
 */
const writeComponentSummaryAPI = async (handoff: Handoff, componentData: ComponentListObject[]) => {
  componentData.sort((a, b) => a.title.localeCompare(b.title));
  await fs.writeFile(path.resolve(getAPIPath(handoff), 'components.json'), JSON.stringify(componentData, null, 2));
};

export const writeComponentApi = async (
  id: string,
  component: TransformComponentTokensResult,
  handoff: Handoff,
  preserveKeys: string[] = []
) => {
  const outputDirPath = path.resolve(getAPIPath(handoff), 'component');
  const outputFilePath = path.resolve(outputDirPath, `${id}.json`);

  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath, { recursive: true });
  }

  // Compute hash of the incoming component (without metadata)
  const newHash = computeComponentHash(component);
  const now = new Date().toISOString();

  if (fs.existsSync(outputFilePath)) {
    const existingJson = await fs.readFile(outputFilePath, 'utf8');
    if (existingJson) {
      try {
        const existingData = JSON.parse(existingJson) as TransformComponentTokensResult;

        // Special case: always allow page to be cleared when undefined
        // This handles the case where page slices are removed
        const finalPreserveKeys = component.page === undefined ? preserveKeys.filter((key) => key !== 'page') : preserveKeys;

        const mergedData = updateObject(existingData, component, finalPreserveKeys);

        // Compute hash of merged data (without metadata)
        const mergedHash = computeComponentHash(mergedData);

        // Check if content has changed by comparing hashes
        const existingHash = existingData?.hash;
        const hasChanged = existingHash !== mergedHash;

        if (hasChanged && existingData) {
          // Content changed - archive the old version
          const existingVersion = existingData.version ?? 1;
          const newVersion = existingVersion + 1;

          // Archive the existing data
          const archiveFilename = await archiveComponentVersion(handoff, id, existingData, now);

          // Read or create versions file
          let versions = await readVersionsFile(handoff, id);
          if (!versions) {
            versions = {
              id,
              currentVersion: 1,
              versions: [],
            };

            // If this is the first versioning, add the original version
            if (existingHash) {
              versions.versions.push({
                version: existingVersion,
                hash: existingHash,
                timestamp: existingData.lastModified ?? now,
                filename: archiveFilename,
              });
            }
          } else {
            // Add the archived version to versions list
            versions.versions.push({
              version: existingVersion,
              hash: existingHash ?? '',
              timestamp: existingData.lastModified ?? now,
              filename: archiveFilename,
            });
          }

          // Update current version
          versions.currentVersion = newVersion;

          // Write versions file
          await writeVersionsFile(handoff, id, versions);

          // Update merged data with new metadata
          mergedData.hash = mergedHash;
          mergedData.lastModified = now;
          mergedData.version = newVersion;
        } else {
          // No change - preserve existing metadata
          mergedData.hash = existingData?.hash ?? mergedHash;
          mergedData.lastModified = existingData?.lastModified ?? now;
          mergedData.version = existingData?.version ?? 1;
        }

        await fs.writeFile(outputFilePath, JSON.stringify(mergedData, null, 2));
        return;
      } catch (_) {
        // Unable to parse existing file - treat as new
      }
    }
  }

  // New component - set initial metadata
  const initialData: TransformComponentTokensResult = {
    ...component,
    hash: newHash,
    lastModified: now,
    version: 1,
  };

  await fs.writeFile(outputFilePath, JSON.stringify(initialData, null, 2));
};


/**
 * Update the main component summary API with the new component data
 * @param handoff
 * @param componentData
 */
export const updateComponentSummaryApi = async (handoff: Handoff, componentData: ComponentListObject[], isFullRebuild: boolean = false) => {
  if (isFullRebuild) {
    // Full rebuild: replace the entire file
    await writeComponentSummaryAPI(handoff, componentData);
    return;
  }

  // Partial update: merge with existing data
  const apiPath = path.resolve(handoff.workingPath, 'public/api/components.json');
  let existingData: ComponentListObject[] = [];

  if (fs.existsSync(apiPath)) {
    try {
      const existing = await fs.readFile(apiPath, 'utf8');
      existingData = JSON.parse(existing);
    } catch {
      // Corrupt or missing JSON — treat as empty
      existingData = [];
    }
  }

  // Replace existing entries with same ID
  const incomingIds = new Set(componentData.map((c) => c.id));
  const merged = [...componentData, ...existingData.filter((c) => !incomingIds.has(c.id))];

  // Always write the file (even if merged is empty)
  await writeComponentSummaryAPI(handoff, merged);
};

/**
 * Read the component API data
 * @param handoff
 * @param id
 * @returns
 */
export const readComponentApi = async (handoff: Handoff, id: string): Promise<TransformComponentTokensResult | null> => {
  const outputFilePath = path.resolve(getAPIPath(handoff), 'component', `${id}.json`);

  if (fs.existsSync(outputFilePath)) {
    try {
      const existingJson = await fs.readFile(outputFilePath, 'utf8');
      if (existingJson) {
        return JSON.parse(existingJson) as TransformComponentTokensResult;
      }
    } catch (_) {
      // Unable to parse existing file
    }
  }
  return null;
};

/**
 * Read the component metadata/summary from the component JSON file
 * @param handoff
 * @param id
 * @returns The component summary or null if not found
 */
export const readComponentMetadataApi = async (handoff: Handoff, id: string): Promise<ComponentListObject | null> => {
  const componentData = await readComponentApi(handoff, id);
  if (!componentData) {
    return null;
  }

  // Construct the summary from the full component data
  return {
    id,
    title: componentData.title,
    description: componentData.description,
    type: componentData.type,
    group: componentData.group,
    image: componentData.image ? componentData.image : '',
    figma: componentData.figma ? componentData.figma : '',
    figmaComponentId: componentData.figmaComponentId,
    categories: componentData.categories ? componentData.categories : [],
    tags: componentData.tags ? componentData.tags : [],
    properties: componentData.properties,
    previews: componentData.previews,
    path: `/api/component/${id}.json`,
  };
};

/**
 * Read the version history for a component
 * @param handoff
 * @param id
 * @returns The component versions or null if not found
 */
export const readComponentVersionsApi = async (handoff: Handoff, id: string): Promise<ComponentVersions | null> => {
  return readVersionsFile(handoff, id);
};

/**
 * Read a specific archived version of a component
 * @param handoff
 * @param id
 * @param filename The archived version filename
 * @returns The component data for that version or null if not found
 */
export const readArchivedComponentVersionApi = async (
  handoff: Handoff,
  id: string,
  filename: string
): Promise<TransformComponentTokensResult | null> => {
  const archiveFilePath = path.resolve(getVersionsPath(handoff, id), filename);

  if (fs.existsSync(archiveFilePath)) {
    try {
      const content = await fs.readFile(archiveFilePath, 'utf8');
      return JSON.parse(content) as TransformComponentTokensResult;
    } catch {
      // Unable to parse archived file
    }
  }
  return null;
};

export default writeComponentSummaryAPI;
