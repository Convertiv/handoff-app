import * as React from 'react';
import type { GetStaticProps } from 'next';
import IframeResizer from 'iframe-resizer-react';
import Icon from 'components/Icon';
import type { PreviewObject } from 'figma-exporter/src/types';
import { getConfig, getPreview } from 'config';
import { PaginationDesignComponent, PaginationLayoutComponent } from 'figma-exporter/src/exporters/components/component_sets/pagination';
import { startCase } from 'lodash';
import { transformPaginationComponentTokensToScssVariables } from 'figma-exporter/src/transformers/scss/components/pagination';
import { ComponentTab } from 'types/tabs';
import Head from 'next/head';
import Header from 'components/Header';
import * as util from 'components/util';
import CustomNav from 'components/SideNav/Custom';
import AnchorNav from 'components/AnchorNav';
import ComponentGuidelines from 'components/ComponentGuidelines';
import { CodeHighlight } from 'components/util/CodeHighlight';


const PaginationDisplay: React.FC<{ pagination: PreviewObject | undefined }> = ({ pagination }) => {
  return (
    <IframeResizer
      style={{
        width: '1px',
        minWidth: '100%',
      }}
      heightCalculationMethod="bodyOffset"
      srcDoc={pagination?.preview}
      scrolling={false}
      checkOrigin={false}
    />
  );
};


const size_sort = ['xl', 'lg', 'md', 'sm', 'xs'];

const config = getConfig();
const pagination = {
  design: config.components.pagination
    .filter((component): component is PaginationDesignComponent => component.componentType === 'design')
    .filter((component) => component.theme === 'light')
    .filter((component) => component.state === 'default')
    .map((pagination) => {
      const preview = getPreview().components.pagination.find((item) => item.id === pagination.id);

      return {
        ...pagination,
        preview,
      };
    }),
  sizes: config.components.pagination
    .filter((component): component is PaginationLayoutComponent => component.componentType === 'layout')
    .sort(function (a, b) {
      return size_sort.indexOf(a.size) - size_sort.indexOf(b.size);
    })
    .map((pagination) => {
      const preview = getPreview().components.pagination.find((item) => item.id === pagination.id);

      return {
        ...pagination,
        preview
      };
    }),
};

/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = async (context) => {
  // Read current slug
  return util.fetchDocPageMarkdown('docs/components/', 'pagination', `/components`);
};

const PaginationPage = ({ content, menu, metadata, current }: util.DocumentationProps) => {
  const [activeTab, setActiveTab] = React.useState<ComponentTab>(ComponentTab.Overview);

  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} />
      {current.subSections.length > 0 && <CustomNav menu={current} />}
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero">
            <div>
              <h1>{metadata.title}</h1>
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
                  {pagination.design.map((item) => (
                    <div key={`${item.id}`} id={item.id}>
                      <h4>Pagination</h4>
                      <p>{item.description}</p>
                      <div className="c-component-preview">
                        <PaginationDisplay pagination={item.preview} />
                      </div>
                      <CodeHighlight data={item.preview} />
                      <hr />
                    </div>
                  ))}

                  {pagination.sizes.map((item) => (
                    <div key={item.id} id={item.id}>
                      <h4>{startCase(item.size)} Pagination</h4>
                      <div className="c-component-preview">
                        <PaginationDisplay pagination={item.preview} />
                      </div>
                      <CodeHighlight data={item.preview} />
                      <hr />
                    </div>
                  ))}

                  <div id="guidelines">
                    <ComponentGuidelines content={content} />
                  </div>

                  <div id="classes">
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
                        {pagination.design.map((item) => (
                          <tr key={`classes-${item.id}`}>
                            <td>Pagination</td>
                            <td>
                              <code>pagination</code>
                            </td>
                          </tr>
                        ))}
                        {pagination.sizes.map((item) => (
                          <tr key={`classes-${item.id}`}>
                            <td>{startCase(item.size)} Pagination</td>
                            <td>
                              <code>pagination pagination-{item.size}</code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="o-col-3@xl u-visible@lg">
                  <AnchorNav groups={[{ guidelines: 'Component Guidelines' }, { classes: 'Classes' }]} />
                </div>
              </>
            )}
            {activeTab == ComponentTab.DesignTokens && (
              <>
                <div className="o-col-12@md">
                  <h4 id="design-tokens">Design Tokens</h4>
                  <p>Complete list of all CSS variables for the component.</p>
                  <table>
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Value</th>
                        <th>SCSS Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.components.pagination.map((input) =>
                        Object.entries(transformPaginationComponentTokensToScssVariables(input)).map(([variable, value]) => (
                          <tr key={variable}>
                            <td>{value.property}</td>
                            <td>{value.value}</td>
                            <td>
                              <code>{variable}</code>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
export default PaginationPage;
