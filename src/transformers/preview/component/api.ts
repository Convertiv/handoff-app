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

export default writeComponentSummaryAPI;
