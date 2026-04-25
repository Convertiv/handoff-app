import fs from 'fs-extra';
import path from 'path';
import Handoff from '../../../index';
import { TransformComponentTokensResult } from '../types';
import { getDocumentedPreviews } from './previews';
import { getAPIPath, sanitizeComponentApiData } from './api';
import { MAIN_COMPONENT_CSS_FILE, SHARED_COMPONENT_CSS_FILE } from './css';
import { MAIN_COMPONENT_JS_FILE } from './javascript';

const COMPONENT_JS_RESERVED_FILES = new Set([MAIN_COMPONENT_JS_FILE]);
const COMPONENT_CSS_RESERVED_FILES = new Set([MAIN_COMPONENT_CSS_FILE, SHARED_COMPONENT_CSS_FILE]);

export const getComponentApiPath = (handoff: Handoff) => path.resolve(getAPIPath(handoff), 'component');

const getComponentPreviewKeys = async (handoff: Handoff, componentId: string): Promise<Set<string>> => {
  const runtimeComponent = handoff.runtimeConfig?.entries?.components?.[componentId];
  const previewKeys = new Set<string>();

  const outputFilePath = path.resolve(getComponentApiPath(handoff), `${componentId}.json`);
  if (fs.existsSync(outputFilePath)) {
    try {
      const existingJson = await fs.readFile(outputFilePath, 'utf8');
      if (existingJson) {
        const existingData = sanitizeComponentApiData(JSON.parse(existingJson) as TransformComponentTokensResult);
        for (const previewKey of Object.keys(existingData?.previews || {})) {
          previewKeys.add(previewKey);
        }
      }
    } catch {
      // Fall back to runtime config below.
    }
  }

  for (const previewKey of Object.keys(getDocumentedPreviews(runtimeComponent?.previews) || {})) {
    previewKeys.add(previewKey);
  }

  for (const previewKey of Object.keys(runtimeComponent?.internalPatternPreviews || {})) {
    previewKeys.add(previewKey);
  }

  return previewKeys;
};

const getArtifactComponentId = (fileName: string, componentIds: Iterable<string>): string | null => {
  let match: string | null = null;

  for (const componentId of Array.from(componentIds)) {
    if (!fileName.startsWith(`${componentId}-`)) continue;
    if (!match || componentId.length > match.length) {
      match = componentId;
    }
  }

  return match;
};

export const removeComponentApi = async (handoff: Handoff, id: string): Promise<void> => {
  const outputDirPath = getComponentApiPath(handoff);
  const outputFilePath = path.resolve(outputDirPath, `${id}.json`);

  if (await fs.pathExists(outputFilePath)) {
    await fs.remove(outputFilePath);
  }
};

export const syncComponentArtifacts = async (handoff: Handoff): Promise<void> => {
  const componentPath = getComponentApiPath(handoff);
  await fs.ensureDir(componentPath);

  const runtimeComponents = handoff.runtimeConfig?.entries?.components ?? {};
  const runtimeIds = Object.keys(runtimeComponents);
  const entries = await fs.readdir(componentPath);

  const discoveredArtifactIds = new Set<string>(runtimeIds);
  for (const entry of entries) {
    const parsed = path.parse(entry);
    if (parsed.ext === '.json' || parsed.ext === '.js' || parsed.ext === '.css') {
      if (!COMPONENT_JS_RESERVED_FILES.has(entry) && !COMPONENT_CSS_RESERVED_FILES.has(entry)) {
        discoveredArtifactIds.add(parsed.name);
      }
    }
  }

  const validFiles = new Set<string>();
  for (const componentId of runtimeIds) {
    validFiles.add(`${componentId}.json`);

    if (await fs.pathExists(path.resolve(componentPath, `${componentId}.js`))) {
      validFiles.add(`${componentId}.js`);
    }

    if (await fs.pathExists(path.resolve(componentPath, `${componentId}.css`))) {
      validFiles.add(`${componentId}.css`);
    }

    const previewKeys = await getComponentPreviewKeys(handoff, componentId);
    for (const previewKey of Array.from(previewKeys)) {
      validFiles.add(`${componentId}-${previewKey}.html`);
      validFiles.add(`${componentId}-${previewKey}-inspect.html`);
    }
  }

  for (const entry of entries) {
    if (COMPONENT_JS_RESERVED_FILES.has(entry) || COMPONENT_CSS_RESERVED_FILES.has(entry)) {
      continue;
    }

    const parsed = path.parse(entry);

    if (parsed.ext === '.json' || parsed.ext === '.js' || parsed.ext === '.css') {
      if (!validFiles.has(entry)) {
        await fs.remove(path.resolve(componentPath, entry));
      }
      continue;
    }

    if (parsed.ext !== '.html') {
      continue;
    }

    const ownerId = getArtifactComponentId(entry, discoveredArtifactIds);
    if (!ownerId) {
      continue;
    }

    if (!validFiles.has(entry)) {
      await fs.remove(path.resolve(componentPath, entry));
    }
  }
};
