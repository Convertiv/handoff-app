import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../../index';
import { ComponentListObject, TransformComponentTokensResult } from '../types';

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

  if (fs.existsSync(outputFilePath)) {
    const existingJson = await fs.readFile(outputFilePath, 'utf8');
    if (existingJson) {
      try {
        const existingData = JSON.parse(existingJson) as TransformComponentTokensResult;

        // Special case: always allow page to be cleared when undefined
        // This handles the case where page slices are removed
        const finalPreserveKeys = component.page === undefined ? preserveKeys.filter((key) => key !== 'page') : preserveKeys;

        const mergedData = updateObject(existingData, component, finalPreserveKeys);
        await fs.writeFile(outputFilePath, JSON.stringify(mergedData, null, 2));
        return;
      } catch (_) {
        // Unable to parse existing file
      }
    }
  }

  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath, { recursive: true });
  }

  await fs.writeFile(outputFilePath, JSON.stringify(component, null, 2));
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
  const apiPath = path.resolve(handoff.workingPath, `${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/components.json`);
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

export default writeComponentSummaryAPI;
