import chalk from 'chalk';
import path from 'path';
import Handoff from '../../../index';
import { getComponentPath, processSharedStyles } from '../component';
import { ComponentListObject, ComponentType, TransformComponentTokensResult } from '../types';
import { writeComponentApi, writeComponentMetadataApi } from './api';
import buildComponentCss from './css';
import buildPreviews from './html';
import buildComponentJs from './javascript';
import parseComponentJson from './json';
import getVersionsForComponent, { getLatestVersionForComponent } from './versions';

const defaultComponent: TransformComponentTokensResult = {
  id: '',
  title: 'Untitled',
  image: '',
  description: 'No description provided',
  preview: 'No preview available',
  type: ComponentType.Element,
  group: 'default',
  should_do: [],
  should_not_do: [],
  categories: [],
  tags: [],
  previews: {
    generic: {
      title: 'Default',
      values: {},
      url: '',
    },
  },
  properties: {},
  code: '',
  html: '',
  js: null,
  css: null,
  sass: null,
};

/**
 * Process process a specific component
 * @param handoff
 * @param file
 * @param sharedStyles
 */
export async function processComponent(handoff: Handoff, id: string, sharedStyles?: string): Promise<ComponentListObject> {
  if (!sharedStyles) sharedStyles = await processSharedStyles(handoff);
  const versions = await getVersionsForComponent(handoff, id);
  const latest = getLatestVersionForComponent(versions);
  console.log(chalk.green(`Processing component ${id} `));
  let latestVersion: TransformComponentTokensResult | undefined = undefined;
  await Promise.all(
    versions.map(async (version) => {
      let data: TransformComponentTokensResult = { ...defaultComponent, id };
      const componentPath = path.join(getComponentPath(handoff), id, version);
      data = await parseComponentJson(id, componentPath, data);
      data = await buildComponentJs(id, componentPath, data, handoff);
      data = await buildComponentCss(id, componentPath, data, handoff, sharedStyles);
      data = await buildPreviews(id, componentPath, data, handoff);
      data.sharedStyles = sharedStyles;
      await writeComponentApi(id, data, version, handoff);
      if (version === latest) {
        latestVersion = data;
      }
    })
  );
  if (latestVersion) {
    writeComponentApi(id, latestVersion, 'latest', handoff);
    const summary = await buildComponentSummary(id, latestVersion, versions);
    writeComponentMetadataApi(id, summary, handoff);
    return summary;
  }
  throw new Error(`No latest version found for ${id}`);
}

const buildComponentSummary = (id: string, latest: TransformComponentTokensResult, versions: string[]): ComponentListObject => {
  return {
    id,
    version: versions[0],
    title: latest.title,
    description: latest.description,
    type: latest.type,
    group: latest.group,
    image: latest.image ? latest.image : '',
    categories: latest.categories ? latest.categories : [],
    tags: latest.tags ? latest.tags : [],
    properties: latest.properties,
    previews: latest.previews,
    versions,
    paths: versions.map((version) => `/api/component/${id}/${version}.json`),
  };
};

export default processComponent;
