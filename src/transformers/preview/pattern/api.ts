import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../../index';
import { getAPIPath } from '../component/api';
import { PatternListObject, TransformPatternResult } from './types';

export const getPatternAPIPath = (handoff: Handoff) => {
  const patternPath = path.resolve(getAPIPath(handoff), 'pattern');
  if (!fs.existsSync(patternPath)) {
    fs.mkdirSync(patternPath, { recursive: true });
  }
  return patternPath;
};

export const writePatternApi = async (id: string, patternData: TransformPatternResult, handoff: Handoff) => {
  const outputDirPath = getPatternAPIPath(handoff);
  const outputFilePath = path.resolve(outputDirPath, `${id}.json`);
  await fs.writeFile(outputFilePath, JSON.stringify(patternData, null, 2));
};

const writePatternSummaryAPI = async (handoff: Handoff, patternData: PatternListObject[]) => {
  patternData.sort((a, b) => a.title.localeCompare(b.title));
  await fs.writeFile(path.resolve(getAPIPath(handoff), 'patterns.json'), JSON.stringify(patternData, null, 2));
};

export const updatePatternSummaryApi = async (handoff: Handoff, patternData: PatternListObject[], isFullRebuild: boolean = false) => {
  if (isFullRebuild) {
    await writePatternSummaryAPI(handoff, patternData);
    return;
  }

  const apiPath = path.resolve(getAPIPath(handoff), 'patterns.json');
  let existingData: PatternListObject[] = [];

  if (fs.existsSync(apiPath)) {
    try {
      const existing = await fs.readFile(apiPath, 'utf8');
      existingData = JSON.parse(existing);
    } catch {
      existingData = [];
    }
  }

  const incomingIds = new Set(patternData.map((p) => p.id));
  const merged = [...patternData, ...existingData.filter((p) => !incomingIds.has(p.id))];
  await writePatternSummaryAPI(handoff, merged);
};

export const readPatternApi = async (handoff: Handoff, id: string): Promise<TransformPatternResult | null> => {
  const outputFilePath = path.resolve(getPatternAPIPath(handoff), `${id}.json`);

  if (fs.existsSync(outputFilePath)) {
    try {
      const existingJson = await fs.readFile(outputFilePath, 'utf8');
      if (existingJson) {
        return JSON.parse(existingJson) as TransformPatternResult;
      }
    } catch (_) {
      // Unable to parse
    }
  }
  return null;
};

export default writePatternSummaryAPI;
