import * as React from 'react';
import { GetStaticProps } from 'next';
import IframeResizer from 'iframe-resizer-react';
import { ComponentDocumentationProps, fetchCompDocPageMarkdown, fetchExportable, fetchExportables, getPreview, getTokens } from '../../../components/util';
import { getConfig } from '../../../../config';
import { IParams, reduceSlugToString } from '../../../components/util';
import { ExportableDefinition, ExportableOptions, PreviewObject } from '../../../../types';
import { Component } from '../../../../exporters/components/extractor';
import Head from 'next/head';
import Header from '../../../components/Header';
import CustomNav from '../../../components/SideNav/Custom';
import AnchorNav from '../../../components/AnchorNav';
import Icon from '../../../components/Icon';
import { ComponentTab } from '../../../../types/tabs';
import startCase from 'lodash/startCase';
import { CodeHighlight } from '../../../components/Markdown/CodeHighlight';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import rehypeRaw from 'rehype-raw';
import { DownloadTokens } from '../../../components/DownloadTokens';
import ComponentDesignTokens from '../../../components/ComponentDesignTokens';
import { filterOutNull } from '../../../../utils';

/**
 * Render all index pages
 * @returns
 */
export async function getStaticPaths() {
  return {
    paths: fetchExportables().map(exportable => ({ params: { component: exportable.id } })),
    fallback: false, // can also be true or 'blocking'
  }
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
  const { component } = context.params as IParams;
  const componentSlug = reduceSlugToString(component);
  
  return {
    props: {
      ...fetchCompDocPageMarkdown('docs/components/', componentSlug, `/components`).props,
      config: getConfig(),
      exportable: fetchExportable(componentSlug!),
      components: getTokens().components[componentSlug!],
      previews: getPreview().components[componentSlug!],
      component,
    }
  };
};

const GenericComponentPage = ({ content, menu, metadata, current, component, exportable, scss, css, styleDictionary, types, components, previews, config }: ComponentDocumentationProps) => {
  const [activeTab, setActiveTab] = React.useState<ComponentTab>(ComponentTab.Overview);
  const designComponents = components ? components.filter(component => component.type === 'design') : [];

  const overviewTabComponents = getComponentsAsComponentPreviews('overview', exportable, components, previews, config.component_sort);
  const designTokensTabComponents = getComponentsAsComponentPreviews('designTokens', exportable, components, previews, config.component_sort)

  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config}/>
      {current.subSections.length > 0 && <CustomNav menu={current} />}
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero">
            <div>
              <h1>{metadata.title ?? component}</h1>
              <p>{metadata.description}</p>
            </div>
            {metadata.image && <Icon name={metadata.image} className="c-hero__img" />}
            <div className="c-tabs">
              <button
                className={`c-tabs__item ${activeTab === ComponentTab.Overview ? 'is-selected' : ''}`}
                onClick={() => setActiveTab(ComponentTab.Overview)}
              >
                Overview
              </button>
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
                  <OverviewComponentPreview components={overviewTabComponents} options={exportable.options} />
                  <div id="guidelines">
                    <OverviewComponentGuidlines content={content} />
                  </div>
                  <div id="classes">
                    <OverviewComponentClasses components={overviewTabComponents} options={exportable.options} />
                  </div>
                </div>
                <div className="o-col-3@xl u-visible@lg">
                  <AnchorNav
                    groups={[
                      Object.assign({}, ...[...overviewTabComponents.map((obj) => ({ [obj.component.id]: getComponentPreviewTitle(obj.component, exportable.options) }))]),
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
                  <DownloadTokens componentId={component} scss={scss} css={css} styleDictionary={styleDictionary} types={types} />
                </div>
                {designTokensTabComponents.map(previewableComponent => (
                  <ComponentDesignTokens
                    key={previewableComponent.component.id}
                    title={getComponentPreviewTitle(previewableComponent.component, exportable.options)}
                    previewObject={previewableComponent.component}
                    transformerOptions={exportable.options.transformer}
                    designComponents={designComponents}
                    overrides={previewableComponent.overrides}
                  >
                    <ComponentDisplay component={previewableComponent.preview} />
                  </ComponentDesignTokens>
                ))}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default GenericComponentPage;

type ComponentPreview = {
  component: Component,
  preview: PreviewObject | undefined,
  overrides?: { states?: string[] | undefined }
};

type ComponentPreviews = ComponentPreview[];

const getComponentsAsComponentPreviews = (tab: 'overview' | 'designTokens', exportable: ExportableDefinition, components: Component[], previews: PreviewObject[], sort: string[]) => {
  if (!(tab in (exportable.options.demo.tabs ?? {}))) return [];

  const tabFilters = (exportable.options.demo.tabs[tab] ?? {});
  const tabComponents: ComponentPreview[] = components
    .filter((component) => {
      if (component.type === 'design' && component.theme !== undefined) {
        return component.theme === 'light';
      }

      return true;
    })
    .map((component) => {
      if (!(component.type in tabFilters)) {
        return null;
      }

      const variantProps = new Map(component.variantProperties);

      if (tabFilters[component.type] === null) {
        return null;
      }

      let overrides: { states?: string[] } | undefined = undefined;

      const filterProps = Object.keys(tabFilters[component.type]);
      for (const filterProp of filterProps) {
        if (!variantProps.get(filterProp)) {
          continue;
        }
        
        const filterValue = tabFilters[component.type][filterProp];

        if (typeof filterValue === 'object' && filterValue !== null) {
          if (Array.isArray(filterValue)) {
            // Filter value is a array so we check if the value of the respective component property
            // is contained in the filter value array
            if (!filterValue.includes(variantProps.get(filterProp))) {
              // Filter value array does not contain the value of the respective component property
              // Since component should not be displayed we return null value
              return null;
            }
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
            }
          }
        } else if (typeof filterValue === 'string' && variantProps.get(filterProp) !== filterValue) {
          return null;
        }
      }

      return {
        component: component,
        preview: previews.find((item) => item.id === component.id),
        overrides
      };
    })
    .filter(filterOutNull)
    .sort(function (a, b) {
      const firstComponent = a.component;
      const secondComponent = b.component;
      const componentTypeOrder = ["design", "layout"];

      if (!sort || sort.length === 0) {
        return 0
      };

      const lStr = getDefaultVariantDiscriminator(firstComponent, exportable.options);
      const rStr = getDefaultVariantDiscriminator(secondComponent, exportable.options);

      const l = sort.indexOf(lStr) >>> 0;
      const r = sort.indexOf(rStr) >>> 0;

      const componentTypeCompareResult = componentTypeOrder.indexOf(a.component.type) - componentTypeOrder.indexOf(b.component.type)
      const discriminatorCompareResult = l !== r ? l - r : lStr.localeCompare(rStr);
      
      return componentTypeCompareResult || discriminatorCompareResult;
    });

    return tabComponents;
}

const OverviewComponentPreview: React.FC<{ components: ComponentPreviews, options?: ExportableOptions }> = ({ components, options }) => {
  return (
    <>
      {components.map(previewableComponent => {
        const component = previewableComponent.component;
        return (
          <div key={`${component.id}`} id={component.id}>
            <h4>{getComponentPreviewTitle(component, options)}</h4>
            <p>{component.description}</p>
            <div className="c-component-preview">
              <ComponentDisplay component={previewableComponent.preview} />
            </div>
            <CodeHighlight data={previewableComponent.preview} />
            <hr />
          </div>
        )
      })}
    </>
  );
}

const OverviewComponentClasses: React.FC<{ components: ComponentPreviews, options?: ExportableOptions }> = ({ components, options }) => {
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
            {components.map(previewableComponent => {
              const component = previewableComponent.component;
              return (
                <tr key={`classes-${component.id}`}>
                  <td>{getComponentPreviewTitle(component, options)}</td>
                  <td>
                    <code>{component.name} {component.name}-{getDefaultVariantDiscriminator(component, options)}</code>
                  </td>
                </tr>
              )
            })}
          </>
        </tbody>
      </table>   
    </>
  )
}

const OverviewComponentGuidlines: React.FC<{ content: string }> = ({ content }) => {
  return (
    <>
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
    </>
  )
};

const ComponentDisplay: React.FC<{ component: PreviewObject | undefined }> = ({ component }) => {
  return (
    <IframeResizer
      style={{
        width: '1px',
        minWidth: '100%',
      }}
      heightCalculationMethod="bodyOffset"
      srcDoc={component?.preview}
      scrolling={false}
      checkOrigin={false}
    />
  );
};

export const getComponentPreviewTitle = (component: Component, options?: ExportableOptions): string => { 
  const defaultDiscriminator = getDefaultVariantDiscriminator(component, options);

  return defaultDiscriminator
    ? `${startCase(defaultDiscriminator)} ${startCase(component.name)}`
    : `${startCase(component.name)}`;
}

const getDefaultVariantDiscriminator = (component: Component, options?: ExportableOptions): string => {
  const defaultDiscriminatorItem = options?.shared?.roles?.theme
    ? component.variantProperties.filter(item => item[0] !== options.shared.roles.theme)[0]
    : component.variantProperties[0];

  return defaultDiscriminatorItem ? defaultDiscriminatorItem[1] : undefined;
}