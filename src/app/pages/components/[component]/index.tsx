import * as React from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import rehypeRaw from 'rehype-raw';
import startCase from 'lodash/startCase';
import {
  ComponentDocumentationProps,
  fetchCompDocPageMarkdown,
  fetchComponents,
  getIntegrationObject,
  getLegacyDefinition,
  getPreview,
  getTokens,
} from '../../../components/util';
import { getClientConfig } from '@handoff/config';
import { ComponentDocumentationOptions, PreviewObject } from '@handoff/types';
import { ComponentInstance, FileComponentObject } from '@handoff/exporters/components/types';
import { filterOutNull } from '@handoff/utils';
import { ComponentTab } from '@handoff/types/tabs';
import { IParams, reduceSlugToString } from '../../../components/util';
import Header from '../../../components/Header';
import CustomNav from '../../../components/SideNav/Custom';
import AnchorNav from '../../../components/AnchorNav';
import Icon from '../../../components/Icon';
import { DownloadTokens } from '../../../components/DownloadTokens';
import ComponentDesignTokens from '../../../components/ComponentDesignTokens';
import Footer from '../../../components/Footer';
import { ComponentDisplay, ComponentPreview, ComponentPreviews, OverviewComponentPreview, getComponentPreviewTitle } from '../../../components/ComponentPreview';

/**
 * Render all index pages
 * @returns
 */
export async function getStaticPaths() {
  return {
    paths: fetchComponents().map((exportable) => ({ params: { component: exportable.id } })),
    fallback: false, // can also be true or 'blocking'
  };
}

/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = async (context) => {
  const config = getClientConfig();
  const { component } = context.params as IParams;
  const integrationObject = getIntegrationObject();

  const componentSlug = reduceSlugToString(component);
  const componentObject = getTokens().components[componentSlug!];
  const componentPreviews = getPreview().components[componentSlug!];
  const componentOptions = (integrationObject?.options ?? {})[componentSlug] ?? {};

  return {
    props: {
      id: component,
      component: componentObject,
      legacyDefinition: getLegacyDefinition(componentSlug!),
      previews: componentPreviews,
      integration: componentOptions,
      ...fetchCompDocPageMarkdown('docs/components/', componentSlug, `/components`, integrationObject).props,
      config,
    },
  };
};

const GenericComponentPage = ({
  content,
  menu,
  metadata,
  options,
  current,
  id,
  scss,
  css,
  styleDictionary,
  types,
  component,
  legacyDefinition,
  previews,
  componentOptions,
  config,
}: ComponentDocumentationProps) => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [activeTab, setActiveTab] = React.useState<ComponentTab>(ComponentTab.Overview);
  const [hasPreviews, setHasPreviews] = React.useState<boolean>(false);

  React.useEffect(() => {
    const componentHasPreviews = previews.length > 0;
    setHasPreviews(componentHasPreviews);
    setActiveTab(componentHasPreviews ? ComponentTab.Overview : ComponentTab.DesignTokens);
    setLoading(false);
  }, [component, previews]);

  if (loading) {
    return (
      <div className="c-page">
        <Head>
          <title>{metadata.metaTitle}</title>
          <meta name="description" content={metadata.metaDescription} />
        </Head>
        <Header menu={menu} config={config} />
        <Footer config={config} />
      </div>
    );
  }

  const overviewTabComponents = getComponentPreviews('overview', component, options, previews);
  const tokensTabComponents = getComponentPreviews('tokens', component, options, previews);

  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle ?? startCase(id)}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config} />
      {current.subSections.length > 0 && <CustomNav menu={current} />}
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero">
            <div>
              <h1>{metadata.title ?? startCase(id)}</h1>
              <p>{metadata.description}</p>
            </div>
            {metadata.image && <Icon name={metadata.image} className="c-hero__img" />}
            <div className="c-tabs">
              {hasPreviews && (
                <button
                  className={`c-tabs__item ${activeTab === ComponentTab.Overview ? 'is-selected' : ''}`}
                  onClick={() => setActiveTab(ComponentTab.Overview)}
                >
                  Overview
                </button>
              )}
              <button
                className={`c-tabs__item ${activeTab === ComponentTab.DesignTokens ? 'is-selected' : ''}`}
                onClick={() => setActiveTab(ComponentTab.DesignTokens)}
              >
                Tokens
              </button>
            </div>
          </div>
          <div className="o-row">
            {activeTab == ComponentTab.Overview && (
              <>
                <div className="o-col-9@xl">
                  <OverviewComponentPreview components={overviewTabComponents} />
                  <div id="guidelines">
                    <OverviewComponentGuidlines content={content} />
                  </div>
                  <div id="classes">
                    <OverviewComponentClasses components={overviewTabComponents} />
                  </div>
                </div>
                <div className="o-col-3@xl u-visible@lg">
                  <AnchorNav
                    groups={[
                      Object.assign(
                        {},
                        ...[...overviewTabComponents.map((obj) => ({ [obj.component.id]: getComponentPreviewTitle(obj) }))]
                      ),
                      { guidelines: 'Component Guidelines' },
                      { classes: 'Classes' },
                    ]}
                  />
                </div>
              </>
            )}
            {activeTab == ComponentTab.DesignTokens && (
              <>
                <div className="o-col-12@md u-mb-3 u-mt-4- u-flex u-justify-end ">
                  <DownloadTokens componentId={id} scss={scss} css={css} styleDictionary={styleDictionary} types={types} />
                </div>
                {tokensTabComponents.map((previewComponent) => {
                  return (
                    <ComponentDesignTokens
                      key={previewComponent.component.id}
                      title={getComponentPreviewTitle(previewComponent)}
                      previewObject={previewComponent.component}
                      previewObjectOptions={componentOptions}
                      componentInstances={component?.instances}
                      overrides={previewComponent.overrides}
                      renderPreviews={hasPreviews}
                    >
                      <ComponentDisplay component={previewComponent.preview} />
                    </ComponentDesignTokens>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </section>
      <Footer config={config} />
    </div>
  );
};

export default GenericComponentPage;




export const getComponentPreviews = (
  tab: 'overview' | 'tokens',
  component: FileComponentObject,
  options: ComponentDocumentationOptions,
  previews: PreviewObject[]
) => {
  const hasPreviews = previews.length > 0;
  const instances = component.instances;
  const view = (options?.views ?? {})[tab] ?? {};
  const viewFilters = view.condition ?? {};
  const viewSort = view.sort ?? [];

  let tabComponents: ComponentPreview[] = instances
    .map((componentInstance) => {
      const filterProps = Object.keys(viewFilters);
      const variantProps = new Map(componentInstance.variantProperties);

      let overrides: { states?: string[] } | undefined = undefined;
      let name: string = hasPreviews
        ? componentInstance.variantProperties.filter((variantProp) => !filterProps.includes(variantProp[0]))[0]?.[1]
        : componentInstance.variantProperties.map(([variantProp, value]) => `${variantProp}: ${startCase(value)}`).join(', ');

      for (const filterProp of filterProps) {
        if (!variantProps.get(filterProp)) {
          continue;
        }

        const filterValue = viewFilters[filterProp];

        if (typeof filterValue === 'object' && filterValue !== null) {
          if (Array.isArray(filterValue)) {
            // Filter value is a array so we check if the value of the respective component property
            // is contained in the filter value array
            if (!filterValue.includes(variantProps.get(filterProp))) {
              // Filter value array does not contain the value of the respective component property
              // Since component should not be displayed we return null value
              return null;
            }
            // Use as a default possibly distinctive name
            name ??= variantProps.get(filterProp);
          } else {
            // Filter value is a object so we check if the value of the respective component property
            // is contained within the array of object keys
            if (!Object.keys(filterValue).includes(variantProps.get(filterProp))) {
              // Filter value object keys do not contain the value of the respective component property
              // Since component should not be displayed we return null value
              return null;
            } else {
              // Filter value object keys do contain the value of the respective component property
              // We will store the property value of the filter value object for later use
              overrides = filterValue[variantProps.get(filterProp)];
              // Use as a default possibly distinctive name
              name ??= variantProps.get(filterProp);
            }
          }
        } else if (typeof filterValue === 'string' && variantProps.get(filterProp) !== filterValue) {
          return null;
        }
      }

      return {
        component: componentInstance,
        name: (hasPreviews ? `${startCase(name)} ${startCase(componentInstance.name)}` : name) ?? '',
        preview: previews.find((item) => item.id === componentInstance.id),
        overrides,
      };
    })
    .filter(filterOutNull);

  if (viewSort.length > 0) {
    tabComponents = multiPropSort(viewSort, tabComponents);
  }

  return tabComponents;
};


export const OverviewComponentClasses: React.FC<{ components: ComponentPreviews }> = ({ components }) => {
  return (
    <>
      <h4>Classes</h4>
      <p>Complete list of all CSS classes for the component.</p>
      <table className="u-mb-6">
        <thead>
          <tr>
            <th>Name</th>
            <th>Class</th>
          </tr>
        </thead>
        <tbody>
          <>
            {components.map((previewableComponent) => {
              const component = previewableComponent.component;
              return (
                <tr key={`classes-${component.id}`}>
                  <td>{getComponentPreviewTitle(previewableComponent)}</td>
                  <td>
                    <code>
                      {component.name} {component.name}-{previewableComponent.name}
                    </code>
                  </td>
                </tr>
              );
            })}
          </>
        </tbody>
      </table>
    </>
  );
};

export const OverviewComponentGuidlines: React.FC<{ content: string }> = ({ content }) => {
  return (
    <>
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
    </>
  );
};


function multiPropSort(properties: string[], array: ComponentPreview[]) {
  return array.sort((l, r) => {
    for (const prop of properties) {
      const lVal = new Map(l.component.variantProperties).get(prop);
      const rVal = new Map(r.component.variantProperties).get(prop);

      if (!lVal || lVal === '') {
        return 1; // Move items with undefined or empty string values to the last
      } else if (!rVal || rVal === '') {
        return -1; // Move items with undefined or empty string values to the last
      }

      if (lVal < rVal) {
        return -1;
      } else if (lVal > rVal) {
        return 1;
      }
    }
    return 0; // Objects are considered equal if all properties are equal
  });
}
