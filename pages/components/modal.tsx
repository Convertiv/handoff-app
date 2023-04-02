import * as React from 'react';
import type { GetStaticProps, NextPage } from 'next';
import Prism from 'prismjs';
import Icon from 'components/Icon';
import CopyCode from 'components/CopyCode';
import { ComponentTab } from 'types/tabs';
import Head from 'next/head';
import { getConfig, getPreview } from 'config';
import Header from 'components/Header';
import * as util from 'components/util';
import IframeResizer from 'iframe-resizer-react';
import { PreviewObject } from 'figma-exporter/src/types';
import ComponentDesignTokens from 'components/ComponentDesignTokens';
import { transformModalComponentTokensToScssVariables } from 'figma-exporter/src/transformers/scss/components/modal';
import { ModalDesignComponent } from 'figma-exporter/src/exporters/components/component_sets/modal';
import CustomNav from 'components/SideNav/Custom';
import AnchorNav from 'components/AnchorNav';
import ComponentGuidelines from 'components/ComponentGuidelines';
import { CodeHighlight } from 'components/Markdown/CodeHighlight';
import { ComponentNotFound } from 'components/ComponentNotFound';

const ModalDisplay: React.FC<{ modal: PreviewObject | undefined }> = ({ modal }) => {
  return (
    <IframeResizer
      style={{
        width: '1px',
        minWidth: '100%',
      }}
      heightCalculationMethod="bodyOffset"
      srcDoc={modal?.preview}
      scrolling={false}
      checkOrigin={false}
    />
  );
};

const config = getConfig();
const preview = getPreview();
const designComponents = config.components.modal.filter(
  (component): component is ModalDesignComponent => component.componentType === 'design'
);
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
  return util.fetchCompDocPageMarkdown('docs/components/', 'modal', `/components`);
};

const ModalPage = ({ content, menu, metadata, current, componentFound }: util.ComponentDocumentationProps) => {
  const [activeTab, setActiveTab] = React.useState<ComponentTab>(ComponentTab.Overview);

  if (!componentFound) {
    return <ComponentNotFound menu={menu} metadata={metadata} current={current} content={content}></ComponentNotFound>;
  }

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
                  {designComponents.slice(0, 1).map((modal) => (
                    <div key={modal.id} id={modal.id}>
                      <h4 id="modal">Modal</h4>
                      <p>{modal.description}</p>
                      <div className="c-component-preview">
                        <ModalDisplay modal={preview.components.modal.find((item) => item.id === modal.id)} />
                      </div>
                      <CodeHighlight data={preview.components.modal.find((item) => item.id === modal.id)} />
                    </div>
                  ))}

                  <div id="guidelines">
                    <ComponentGuidelines content={content} />
                  </div>
                </div>
                <div className="o-col-3@xl u-visible@lg">
                  <AnchorNav
                    groups={[
                      Object.assign({}, ...[...designComponents.slice(0, 1).map((modal) => ({ [modal.id]: `Modal` }))]),
                      { guidelines: 'Component Guidelines' },
                    ]}
                  />
                </div>
              </>
            )}
            {activeTab == ComponentTab.DesignTokens && (
              <>
                {designComponents.slice(0, 1).map((modal) => (
                  <ComponentDesignTokens
                    key={modal.id}
                    transformer={transformModalComponentTokensToScssVariables}
                    componentName={'Modal'}
                    designComponents={designComponents.slice(0, 1)}
                    previewObject={modal}
                    layout={{
                      cols: {
                        left: 5,
                        right: 7
                      }
                    }}
                  >
                    <ModalDisplay modal={preview.components.modal.find((item) => item.id === modal.id)} />
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
export default ModalPage;
