import Handoff from '../../../index';
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
  format: 'html',
  js: null,
  css: null,
  sass: null,
};

/**
 * Types of component segments that can be updated
 */
export enum ComponentSegment {
  JavaScript = 'javascript',
  Style = 'style',
  Previews = 'previews',
  Validation = 'validation',
}

/**
 * Process components and generate their code, styles, and previews
 * @param handoff - The Handoff instance containing configuration and state
 * @param id - Optional component ID to process a specific component
 * @param segmentToProcess - Optional segment to update
 * @returns Promise resolving to an array of processed components
 */
export async function processComponents(
  handoff: Handoff,
  id?: string,
  segmentToProcess?: ComponentSegment
): Promise<ComponentListObject[]> {
  const result: ComponentListObject[] = [];

  const components = (await handoff.getDocumentationObject()).components;
  const sharedStyles = await handoff.getSharedStyles();
  const runtimeComponents = handoff.integrationObject?.entries?.components ?? {};

  for (const runtimeComponentId of Object.keys(runtimeComponents)) {
    if (!!id && runtimeComponentId !== id) {
      continue;
    }

    const versions = Object.keys(runtimeComponents[runtimeComponentId]);
    const latest = getLatestVersionForComponent(versions);
    let latestVersion: TransformComponentTokensResult | undefined;

    await Promise.all(
      versions.map(async (version) => {
        const runtimeComponent = runtimeComponents[runtimeComponentId][version];
        const { type, ...restMetadata } = runtimeComponent;

        let data: TransformComponentTokensResult = {
          ...defaultComponent,
          ...restMetadata,
          type: (type as ComponentType) || ComponentType.Element,
        };

        if (!segmentToProcess || segmentToProcess === ComponentSegment.JavaScript || segmentToProcess === ComponentSegment.Validation) {
          data = await buildComponentJs(data, handoff);
        }
        if (!segmentToProcess || segmentToProcess === ComponentSegment.Style || segmentToProcess === ComponentSegment.Validation) {
          data = await buildComponentCss(data, handoff, sharedStyles);
        }

        if (!segmentToProcess || segmentToProcess === ComponentSegment.Previews || segmentToProcess === ComponentSegment.Validation) {
          data = await buildPreviews(data, handoff, components);
        }

        if (segmentToProcess === ComponentSegment.Validation && handoff.config?.hooks?.validateComponent) {
          const validationResults = await handoff.config.hooks.validateComponent(data);
          data.validations = validationResults;
        }

        data.sharedStyles = sharedStyles;

        await writeComponentApi(runtimeComponentId, data, version, handoff, true);

        if (version === latest) {
          latestVersion = data;
        }
      })
    );

    if (latestVersion) {
      await writeComponentApi(runtimeComponentId, latestVersion, 'latest', handoff, true);
      const summary = buildComponentSummary(runtimeComponentId, latestVersion, versions);
      await writeComponentMetadataApi(runtimeComponentId, summary, handoff);
      result.push(summary);
    } else {
      throw new Error(`No latest version found for ${runtimeComponentId}`);
    }
  }

  // Always merge and write summary file, even if no components processed
  await updateComponentSummaryApi(handoff, result);

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
