import * as React from 'react';
import type { GetStaticProps, NextPage } from 'next';
import Prism from 'prismjs';
import IframeResizer from 'iframe-resizer-react';
import { getConfig, getPreview } from 'config';
import Icon from 'components/Icon';
import type { PreviewObject } from 'figma-exporter/src/types';
import { transformTooltipComponentTokensToScssVariables } from 'figma-exporter/src/transformers/scss/components/tooltip';
import CopyCode from 'components/CopyCode';
import { ComponentTab } from 'types/tabs';
import Head from 'next/head';
import ComponentDesignTokens from 'components/ComponentDesignTokens';
import Header from 'components/Header';
import { DocumentationProps, fetchDocPageMarkdown } from 'components/util';
import CustomNav from 'components/SideNav/Custom';
import AnchorNav from 'components/AnchorNav';
import ComponentGuidelines from 'components/ComponentGuidelines';

const buildHighlightComponent = (preview: PreviewObject | undefined) => {
  if (!preview) {
    return '';
  }

  return Prism.highlight(preview.code, Prism.languages.html, 'html');
};

const TooltipDisplay: React.FC<{ tooltip: PreviewObject | undefined }> = ({ tooltip }) => {
  return (
    <IframeResizer
      style={{
        width: '1px',
        minWidth: '100%',
      }}
      heightCalculationMethod="bodyOffset"
      srcDoc={tooltip?.preview}
      scrolling={false}
      checkOrigin={false}
    />
  );
};

const CodeHighlight: React.FC<{ tooltip: PreviewObject | undefined }> = ({ tooltip }) => {
  if (tooltip) {
    return (
      <div className="c-code-block">
        <code className="language-html" dangerouslySetInnerHTML={{ __html: buildHighlightComponent(tooltip) }} />
        <CopyCode code={tooltip.code} />
      </div>
    );
  } else {
    return <></>;
  }
};

const config = getConfig();
const preview = getPreview();

const tooltips = config.components.tooltips.filter((tooltip) => tooltip.horizontal === 'left' && tooltip.vertical === 'bottom');

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
  return fetchDocPageMarkdown('docs/components/', 'tooltip', `/components`);
};

const TooltipPage = ({ content, menu, metadata, current }: DocumentationProps) => {
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
                  {tooltips.map((tooltip) => (
                    <div key={tooltip.id} id={tooltip.id}>
                      <h4>Tooltip</h4>
                      <p>{tooltip.description}</p>
                      <div className="c-component-preview u-pt-0 u-pb-0">
                        <TooltipDisplay tooltip={preview.components.tooltips.find((item) => item.id === tooltip.id)} />
                      </div>
                      <CodeHighlight tooltip={preview.components.tooltips.find((item) => item.id === tooltip.id)} />
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
                        <tr>
                          <td>Primary Button</td>
                          <td>
                            <code>c-button c-button--primary</code>
                          </td>
                        </tr>
                        <tr>
                          <td>Secondary Button</td>
                          <td>
                            <code>c-button c-button--secondary</code>
                          </td>
                        </tr>
                        <tr>
                          <td>Transparent Button</td>
                          <td>
                            <code>c-button c-button--transparent</code>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="o-col-3@xl u-visible@lg">
                  <AnchorNav
                    groups={[
                      Object.assign({}, ...[...tooltips.map((obj) => ({ [obj.id]: `Tooltip` }))]),
                      { guidelines: 'Component Guidelines' },
                      { classes: 'Classes' },
                    ]}
                  />
                </div>
              </>
            )}
            {activeTab == ComponentTab.DesignTokens && (
              <>
                {tooltips.map((tooltip) => (
                  <ComponentDesignTokens
                    key={tooltip.id}
                    transformer={transformTooltipComponentTokensToScssVariables}
                    componentName={'Tooltip'}
                    designComponents={tooltips}
                    previewObject={tooltip}
                    layout={{
                      cols: {
                        left: 4,
                        right: 8
                      }
                    }}
                  >
                    <TooltipDisplay tooltip={preview.components.tooltips.find((item) => item.id === tooltip.id)} />
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
export default TooltipPage;
