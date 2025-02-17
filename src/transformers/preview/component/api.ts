import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../../index';
import { ComponentListObject, TransformComponentTokensResult } from '../types';

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

export const writeComponentApi = async (id: string, component: TransformComponentTokensResult, version: string, handoff: Handoff) => {
  const outputPath = path.resolve(getAPIPath(handoff), 'component', id);
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  await fs.writeFile(path.resolve(outputPath, `${version}.json`), JSON.stringify(component, null, 2));
};

export const writeComponentMetadataApi = async (id: string, summary: ComponentListObject, handoff: Handoff) => {
  await fs.writeFile(path.resolve(getAPIPath(handoff), 'component', `${id}.json`), JSON.stringify(summary, null, 2));
};

/**
 * Update the main component summary API with the new component data
 * @param handoff
 * @param componentData
 */
export const updateComponentSummaryApi = async (handoff: Handoff, componentData: ComponentListObject) => {
  const apiPath = path.resolve(handoff.workingPath, `public/api/components.json`);
  let newComponentData = [componentData as ComponentListObject],
    existingData: ComponentListObject[] = [];
  if (fs.existsSync(apiPath)) {
    const existing = await fs.readFile(apiPath, 'utf8');
    if (existing) {
      existingData = JSON.parse(existing);
      existingData = existingData.filter((component) => component.id !== componentData.id);
    }
  }
  await writeComponentSummaryAPI(handoff, newComponentData.concat(existingData));
};

export default writeComponentSummaryAPI;
