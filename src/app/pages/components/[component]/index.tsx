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
import Footer from '../../../components/Footer';

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

  const overviewTabComponents = getComponentsAsComponentPreviews('overview', exportable, components, previews, config?.app?.component_sort);
  const designTokensTabComponents = getComponentsAsComponentPreviews('designTokens', exportable, components, previews, config?.app?.component_sort)

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
                      Object.assign({}, ...[...overviewTabComponents.map((obj) => ({ [obj.component.id]: getComponentPreviewTitle(obj) }))]),
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
                    title={getComponentPreviewTitle(previewableComponent)}
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
      <Footer config={config} />
    </div>
  );
};

export default GenericComponentPage;

type ComponentPreview = {
  component: Component,
  possiblyDistinctiveName: string,
  preview: PreviewObject | undefined,
  overrides?: { states?: string[] | undefined },
};

type ComponentPreviews = ComponentPreview[];

const getComponentsAsComponentPreviews = (tab: 'overview' | 'designTokens', exportable: ExportableDefinition, components: Component[], previews: PreviewObject[], sort: string[]) => {
  if (!(tab in (exportable.options.demo.tabs ?? {}))) return [];

  const tabFilters = (exportable.options.demo.tabs[tab] ?? {});
  const componentTypeOrder = ["design", "layout"];
  
  const tabComponents: ComponentPreview[] = components
    .map((component) => {
      if (!(component.type in tabFilters)) {
        return null;
      }

      if (tabFilters[component.type] === null) {
        return null;
      }

      const filterProps = Object.keys(tabFilters[component.type]);
      const variantProps = new Map(component.variantProperties);

      let overrides: { states?: string[] } | undefined = undefined;
      let possiblyDistinctiveName: string = component.variantProperties.filter(variantProp => !filterProps.includes(variantProp[0]))[0]?.[1];

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
            // Use as a default possibly distinctive name
            possiblyDistinctiveName ??= variantProps.get(filterProp);
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
              possiblyDistinctiveName ??= variantProps.get(filterProp);
            }
          }
        } else if (typeof filterValue === 'string' && variantProps.get(filterProp) !== filterValue) {
          return null;
        }
      }

      return {
        component: component,
        possiblyDistinctiveName: possiblyDistinctiveName ?? '',
        preview: previews.find((item) => item.id === component.id),
        overrides,
      };
    })
    .filter(filterOutNull)
    .sort(function (first, second) {
      sort ??= [];

      const lStr = first.possiblyDistinctiveName ?? '';
      const rStr = second.possiblyDistinctiveName ?? '';

      const l = sort.indexOf(lStr) >>> 0;
      const r = sort.indexOf(rStr) >>> 0;

      const componentTypeCompareResult = componentTypeOrder.indexOf(first.component.type) - componentTypeOrder.indexOf(second.component.type)
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
            <h4>{getComponentPreviewTitle(previewableComponent)}</h4>
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
                  <td>{getComponentPreviewTitle(previewableComponent)}</td>
                  <td>
                    <code>{component.name} {component.name}-{previewableComponent.possiblyDistinctiveName}</code>
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

export const getComponentPreviewTitle = (previewableComponent: ComponentPreview): string => { 
  return previewableComponent.possiblyDistinctiveName
    ? `${startCase(previewableComponent.possiblyDistinctiveName)} ${startCase(previewableComponent.component.name)}`
    : `${startCase(previewableComponent.component.name)}`
}