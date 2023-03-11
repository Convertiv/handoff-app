import * as React from 'react';
import type { GetStaticProps } from 'next';
import startCase from 'lodash/startCase';
import IframeResizer from 'iframe-resizer-react';
import { getConfig, getPreview } from 'config';
import Icon from 'components/Icon';
import type { PreviewObject } from 'figma-exporter/src/types';
import type { AlertDesignComponent, AlertLayoutComponent } from 'figma-exporter/src/exporters/components/component_sets/alert';
import { transformAlertComponentTokensToScssVariables } from 'figma-exporter/src/transformers/scss/components/alert';
import { ComponentTab } from 'types/tabs';
import ComponentDesignTokens from 'components/ComponentDesignTokens';
import Head from 'next/head';
import * as util from 'components/util';
import Header from 'components/Header';
import CustomNav from 'components/SideNav/Custom';
import AnchorNav from 'components/AnchorNav';
import ComponentGuidelines from 'components/ComponentGuidelines';
import { CodeHighlight } from 'components/util/CodeHighlight';


const AlertDisplay: React.FC<{ alert: PreviewObject | undefined }> = ({ alert }) => {
  return (
    <IframeResizer
      style={{
        width: '1px',
        minWidth: '100%',
      }}
      heightCalculationMethod="bodyOffset"
      srcDoc={alert?.preview}
      scrolling={false}
      checkOrigin={false}
    />
  );
};

const layout_sort = ['horizontal', 'vertical'];

const config = getConfig();

const designComponents = config.components.alerts.filter(
  (component): component is AlertDesignComponent => component.componentType === 'design'
);

const alerts = {
  design: designComponents
    .sort(function (a, b) {
      let l = config.component_sort.indexOf(a.type) >>> 0;
      let r = config.component_sort.indexOf(b.type) >>> 0;
      return l !== r ? l - r : a.type.localeCompare(b.type);
    })
    .map((alert) => {
      const preview = getPreview().components.alerts.find((item) => item.id === alert.id);

      return {
        ...alert,
        preview,
      };
    }),
  layout: config.components.alerts
    .filter((component): component is AlertLayoutComponent => component.componentType === 'layout')
    .sort(function (a, b) {
      return layout_sort.indexOf(a.layout) - layout_sort.indexOf(b.layout);
    })
    .map((alert) => {
      const preview = getPreview().components.alerts.find((item) => item.id === alert.id);

      return {
        ...alert,
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
  return util.fetchDocPageMarkdown('docs/components/', 'alert', `/components`);
};

const AlertPage = ({ content, menu, metadata, current }: util.DocumentationProps) => {
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
                  {alerts.design.map((alert) => (
                    <div key={`${alert.id}`} id={alert.id}>
                      <h4>{startCase(alert.type)} Alert</h4>
                      <p>{alert.description}</p>
                      <div className="c-component-preview">
                        <AlertDisplay alert={alert.preview} />
                      </div>
                      <CodeHighlight data={alert.preview} />
                      <hr />
                    </div>
                  ))}

                  {alerts.layout.map((alert) => (
                    <div key={alert.id} id={alert.id}>
                      <h4>{startCase(alert.layout)} Alert</h4>
                      <div className="c-component-preview">
                        <AlertDisplay alert={alert.preview} />
                      </div>
                      <CodeHighlight data={alert.preview} />
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
                        {alerts.design.map((alert) => (
                          <tr key={`classes-${alert.id}`}>
                            <td>{startCase(alert.type)} Alert</td>
                            <td>
                              <code>alert alert-{alert.type}</code>
                            </td>
                          </tr>
                        ))}
                        {alerts.layout.map((alert) => (
                          <tr key={`classes-${alert.id}`}>
                            <td>{startCase(alert.layout)} Alert</td>
                            <td>
                              <code>alert alert-{alert.layout}</code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="o-col-3@xl u-visible@lg">
                  <AnchorNav
                    groups={[
                      Object.assign({}, ...[...alerts.design.map((obj) => ({ [obj.id]: `${startCase(obj.type)} Alert` }))]),
                      Object.assign({}, ...[...alerts.layout.map((obj) => ({ [obj.id]: `${startCase(obj.layout)} Alert` }))]),
                      {
                        guidelines: 'Component Guidelines',
                      },
                      {
                        classes: 'Classes',
                      },
                    ]}
                  />
                </div>
              </>
            )}
            {activeTab == ComponentTab.DesignTokens && (
              <>
                {alerts.design.map((alert) => (
                  <ComponentDesignTokens
                    key={alert.id}
                    transformer={transformAlertComponentTokensToScssVariables}
                    componentName={'Alert'}
                    designComponents={designComponents}
                    previewObject={alert}
                    layout={{
                      cols: {
                        left: 5,
                        right: 7
                      }
                    }}
                  >
                    <AlertDisplay alert={alert.preview} />
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
export default AlertPage;
