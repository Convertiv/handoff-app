import chalk from 'chalk';
import { FileComponentsObject } from '../../../exporters/components/types';
import Handoff from '../../../index';
import { processSharedStyles } from '../component';
import { ComponentListObject, ComponentType, TransformComponentTokensResult } from '../types';
import { updateComponentSummaryApi, writeComponentApi, writeComponentMetadataApi } from './api';
import buildComponentCss from './css';
import buildPreviews from './html';
import buildComponentJs from './javascript';
import { getLatestVersionForComponent } from './versions';

const defaultComponent: TransformComponentTokensResult = {
  id: '',
  title: 'Untitled',
  figma: '',
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
export async function processComponents(
  handoff: Handoff,
  id?: string,
  sharedStyles?: string,
  components?: FileComponentsObject,
  segmentToUpdate?: 'js' | 'css' | 'previews' | 'validation'
): Promise<ComponentListObject[]> {
  const result: ComponentListObject[] = [];

  if (!sharedStyles) sharedStyles = await processSharedStyles(handoff);

  const runtimeComponents = handoff.integrationObject?.entries?.components ?? {};

  for (const runtimeComponentId of Object.keys(runtimeComponents)) {
    if (!!id && runtimeComponentId !== id) {
      continue;
    }

    const versions = Object.keys(runtimeComponents[runtimeComponentId]);
    const latest = getLatestVersionForComponent(versions);
    let latestVersion: TransformComponentTokensResult | undefined = undefined;

    console.log(chalk.green(`Processing component ${runtimeComponentId} `));

    await Promise.all(
      versions.map(async (version) => {
        const runtimeComponent = runtimeComponents[runtimeComponentId][version];
        let { type, ...restMetadata } = runtimeComponent;
        let data: TransformComponentTokensResult = {
          ...defaultComponent,
          ...restMetadata,
          type: (type as ComponentType) || ComponentType.Element,
        };

        if (!segmentToUpdate || segmentToUpdate === 'js' || segmentToUpdate === 'validation') {
          data = await buildComponentJs(data, handoff);
        }

        if (!segmentToUpdate || segmentToUpdate === 'css' || segmentToUpdate === 'validation') {
          data = await buildComponentCss(data, handoff, sharedStyles);
        }

        if (!segmentToUpdate || segmentToUpdate === 'previews' || segmentToUpdate === 'validation') {
          data = await buildPreviews(data, handoff, components);
        }

        if (segmentToUpdate === 'validation') {
          if (handoff.config?.hooks?.validateComponent && data) {
            const validationResults = await handoff.config.hooks.validateComponent(data);
            data.validations = validationResults;
          }
        }

        data.sharedStyles = sharedStyles;

        await writeComponentApi(runtimeComponentId, data, version, handoff, !!segmentToUpdate);

        if (version === latest) {
          latestVersion = data;
        }
      })
    );

    if (latestVersion) {
      await writeComponentApi(runtimeComponentId, latestVersion, 'latest', handoff, !!segmentToUpdate);
      const summary = buildComponentSummary(runtimeComponentId, latestVersion, versions);
      await writeComponentMetadataApi(runtimeComponentId, summary, handoff);
      await updateComponentSummaryApi(handoff, summary);
      result.push(summary);
    } else {
      throw new Error(`No latest version found for ${runtimeComponentId}`);
    }
  }

  return result;
}

/**
 * Build a summary for the component list
 * @param id
 * @param latest
 * @param versions
 * @returns
 */
const buildComponentSummary = (id: string, latest: TransformComponentTokensResult, versions: string[]): ComponentListObject => {
  return {
    id,
    version: versions[0],
    title: latest.title,
    description: latest.description,
    type: latest.type,
    group: latest.group,
    image: latest.image ? latest.image : '',
    figma: latest.figma ? latest.figma : '',
    categories: latest.categories ? latest.categories : [],
    tags: latest.tags ? latest.tags : [],
    properties: latest.properties,
    previews: latest.previews,
    versions,
    paths: versions.map((version) => `/api/component/${id}/${version}.json`),
  };
};

export default processComponents;
