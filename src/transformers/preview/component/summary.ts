import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../../index';
import { ComponentListObject } from '../types';
import { getDocumentedPreviews } from './previews';
import { getAPIPath } from './api';

const getComponentSummaryPath = (handoff: Handoff): string => path.resolve(getAPIPath(handoff), 'components.json');

const writeComponentSummaryAPI = async (handoff: Handoff, componentData: ComponentListObject[]) => {
  componentData.sort((a, b) => a.title.localeCompare(b.title));
  await fs.writeFile(getComponentSummaryPath(handoff), JSON.stringify(componentData, null, 2));
};

const readExistingComponentSummaryApi = async (handoff: Handoff): Promise<ComponentListObject[]> => {
  const apiPath = getComponentSummaryPath(handoff);
  if (!fs.existsSync(apiPath)) {
    return [];
  }

  try {
    const existing = await fs.readFile(apiPath, 'utf8');
    return (JSON.parse(existing) as ComponentListObject[]).map((component) => ({
      ...component,
      previews: getDocumentedPreviews(component.previews),
    }));
  } catch {
    return [];
  }
};

export const updateComponentSummaryApi = async (
  handoff: Handoff,
  componentData: ComponentListObject[],
  isFullRebuild: boolean = false
) => {
  if (isFullRebuild) {
    await writeComponentSummaryAPI(handoff, componentData);
    return;
  }

  const existingData = await readExistingComponentSummaryApi(handoff);
  const incomingIds = new Set(componentData.map((c) => c.id));
  const merged = [...componentData, ...existingData.filter((c) => !incomingIds.has(c.id))];
  await writeComponentSummaryAPI(handoff, merged);
};

export const removeComponentFromSummaryApi = async (handoff: Handoff, id: string): Promise<void> => {
  const existingData = await readExistingComponentSummaryApi(handoff);
  const filtered = existingData.filter((component) => component.id !== id);
  await writeComponentSummaryAPI(handoff, filtered);
};

export default writeComponentSummaryAPI;
