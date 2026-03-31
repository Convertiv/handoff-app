import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../../index';
import { PatternListObject, PatternObject } from '../types';

export const getPatternAPIPath = (handoff: Handoff): string => {
  const patternPath = path.resolve(handoff.workingPath, 'public/api/pattern');
  if (!fs.existsSync(patternPath)) {
    fs.mkdirSync(patternPath, { recursive: true });
  }
  return patternPath;
};

export const writePatternApi = async (
  id: string,
  pattern: PatternObject,
  handoff: Handoff
): Promise<void> => {
  const outputDir = getPatternAPIPath(handoff);
  const outputFilePath = path.resolve(outputDir, `${id}.json`);
  await fs.writeFile(outputFilePath, JSON.stringify(pattern, null, 2));
};

export const writePatternHtml = async (
  id: string,
  html: string,
  handoff: Handoff
): Promise<void> => {
  const outputDir = getPatternAPIPath(handoff);
  const outputFilePath = path.resolve(outputDir, `${id}.html`);
  await fs.writeFile(outputFilePath, html);
};

export const writePatternSummaryApi = async (
  handoff: Handoff,
  patterns: PatternListObject[]
): Promise<void> => {
  const apiPath = path.resolve(handoff.workingPath, 'public/api');
  if (!fs.existsSync(apiPath)) {
    fs.mkdirSync(apiPath, { recursive: true });
  }
  patterns.sort((a, b) => a.title.localeCompare(b.title));
  await fs.writeFile(
    path.resolve(apiPath, 'patterns.json'),
    JSON.stringify(patterns, null, 2)
  );
};

/**
 * Reads the pattern list summary when present (used for partial pattern rebuilds).
 */
export const readPatternSummaryApi = async (handoff: Handoff): Promise<PatternListObject[] | null> => {
  const summaryPath = path.resolve(handoff.workingPath, 'public/api/patterns.json');
  if (!fs.existsSync(summaryPath)) {
    return null;
  }
  try {
    const raw = await fs.readFile(summaryPath, 'utf8');
    const parsed = JSON.parse(raw) as PatternListObject[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const syncPatternArtifacts = async (
  handoff: Handoff,
  validIds: Iterable<string>
): Promise<void> => {
  const validIdSet = new Set(validIds);
  const patternPath = getPatternAPIPath(handoff);
  const entries = await fs.readdir(patternPath);

  for (const entry of entries) {
    const parsed = path.parse(entry);
    const isPatternArtifact = parsed.ext === '.json' || parsed.ext === '.html';
    if (!isPatternArtifact) continue;

    if (!validIdSet.has(parsed.name)) {
      await fs.remove(path.resolve(patternPath, entry));
    }
  }
};
