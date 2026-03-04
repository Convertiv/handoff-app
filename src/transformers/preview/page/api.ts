import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../../index';
import { getAPIPath } from '../component/api';
import { PageListObject, TransformPageResult } from './types';

export const getPageAPIPath = (handoff: Handoff) => {
  const pagePath = path.resolve(getAPIPath(handoff), 'page');
  if (!fs.existsSync(pagePath)) {
    fs.mkdirSync(pagePath, { recursive: true });
  }
  return pagePath;
};

export const writePageApi = async (id: string, pageData: TransformPageResult, handoff: Handoff) => {
  const outputDirPath = getPageAPIPath(handoff);
  const outputFilePath = path.resolve(outputDirPath, `${id}.json`);
  await fs.writeFile(outputFilePath, JSON.stringify(pageData, null, 2));
};

const writePageSummaryAPI = async (handoff: Handoff, pageData: PageListObject[]) => {
  pageData.sort((a, b) => a.title.localeCompare(b.title));
  await fs.writeFile(path.resolve(getAPIPath(handoff), 'pages.json'), JSON.stringify(pageData, null, 2));
};

export const updatePageSummaryApi = async (handoff: Handoff, pageData: PageListObject[], isFullRebuild: boolean = false) => {
  if (isFullRebuild) {
    await writePageSummaryAPI(handoff, pageData);
    return;
  }

  const apiPath = path.resolve(getAPIPath(handoff), 'pages.json');
  let existingData: PageListObject[] = [];

  if (fs.existsSync(apiPath)) {
    try {
      const existing = await fs.readFile(apiPath, 'utf8');
      existingData = JSON.parse(existing);
    } catch {
      existingData = [];
    }
  }

  const incomingIds = new Set(pageData.map((p) => p.id));
  const merged = [...pageData, ...existingData.filter((p) => !incomingIds.has(p.id))];
  await writePageSummaryAPI(handoff, merged);
};

export const readPageApi = async (handoff: Handoff, id: string): Promise<TransformPageResult | null> => {
  const outputFilePath = path.resolve(getPageAPIPath(handoff), `${id}.json`);

  if (fs.existsSync(outputFilePath)) {
    try {
      const existingJson = await fs.readFile(outputFilePath, 'utf8');
      if (existingJson) {
        return JSON.parse(existingJson) as TransformPageResult;
      }
    } catch (_) {
      // Unable to parse
    }
  }
  return null;
};

export default writePageSummaryAPI;
