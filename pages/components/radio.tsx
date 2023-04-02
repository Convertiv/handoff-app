import * as React from 'react';
import type { GetStaticProps } from 'next';
import Prism from 'prismjs';
import startCase from 'lodash/startCase';
import { getConfig, getPreview } from 'config';
import Icon from 'components/Icon';
import IframeResizer from 'iframe-resizer-react';
import type { PreviewObject } from 'figma-exporter/src/types';
import type { RadioDesignComponent, RadioLayoutComponent } from 'figma-exporter/src/exporters/components/component_sets/radio';
import { transformRadioComponentTokensToScssVariables } from 'figma-exporter/src/transformers/scss/components/radio';
import CopyCode from 'components/CopyCode';
import { ComponentTab } from 'types/tabs';
import ComponentDesignTokens from 'components/ComponentDesignTokens';
import Head from 'next/head';
import Header from 'components/Header';
import { ComponentDocumentationProps, DocumentationProps, fetchCompDocPageMarkdown, fetchDocPageMarkdown } from 'components/util';
import CustomNav from 'components/SideNav/Custom';
import AnchorNav from 'components/AnchorNav';
import ComponentGuidelines from 'components/ComponentGuidelines';
import { CodeHighlight } from 'components/Markdown/CodeHighlight';
import { ComponentNotFound } from 'components/ComponentNotFound';

const RadioDisplay: React.FC<{ radio: PreviewObject | undefined }> = ({ radio }) => {
  return (
    <IframeResizer
      style={{
        width: '1px',
        minWidth: '100%',
      }}
      heightCalculationMethod="bodyOffset"
      srcDoc={radio?.preview}
      scrolling={false}
      checkOrigin={false}
    />
  );
};

const config = getConfig();

const designComponents = config.components.radios.filter(
  (component): component is RadioDesignComponent => component.componentType === 'design'
);

const radios = {
  design: designComponents
    .filter((component) => component.theme === 'light')
    .filter((component) => component.state !== 'hover')
    .filter((component) => component.activity === 'off')
    .sort(function (a, b) {
      let l = config.component_sort.indexOf(a.state) >>> 0;
      let r = config.component_sort.indexOf(b.state) >>> 0;
      return l !== r ? l - r : a.state.localeCompare(b.state);
    })
    .map((radio) => {
      const preview = getPreview().components.radios.find((item) => item.id === radio.id);
      return {
        ...radio,
        preview,
      };
    }),
  tokens: designComponents
    .filter((component) => component.theme === 'light')
    .filter((component) => component.state === 'default')
    .sort(function (a, b) {
      let l = config.component_sort.indexOf(a.state) >>> 0;
      let r = config.component_sort.indexOf(b.state) >>> 0;
      return l !== r ? l - r : a.state.localeCompare(b.state);
    })
    .map((checkbox) => {
      const preview = getPreview().components.radios.find((item) => item.id === checkbox.id);
      return {
        ...checkbox,
        preview,
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
  return fetchCompDocPageMarkdown('docs/components/', 'radio', `/components`);
};

const RadioPage = ({ content, menu, metadata, current, componentFound }: ComponentDocumentationProps) => {
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
                  {radios.design.map((radio) => (
                    <div key={`${radio.id}`} id={radio.id}>
                      <h4>{startCase(radio.state)} Radio</h4>
                      <p>{radio.description}</p>
                      <div className="c-component-preview">
                        <RadioDisplay radio={radio.preview} />
                      </div>
                      <CodeHighlight data={radio.preview} />
                      <hr />
                    </div>
                  ))}

                  <div id="guidelines">
                    <ComponentGuidelines content={content} />
                  </div>

                  <div id="classes">
                    <h4 id="classes">Classes</h4>
                    <p>Complete list of all CSS classes for the component.</p>
                    <table className="u-mb-6">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {radios.design.map((radio) => (
                          <tr key={`classes-${radio.id}`}>
                            <td>{startCase(radio.state)} Radio</td>
                            <td>
                              <code>btn btn-{radio.state}</code>
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
                      Object.assign({}, ...[...radios.design.map((obj) => ({ [obj.id]: `${startCase(obj.state)} Radio` }))]),
                      { guidelines: 'Component Guidelines' },
                      { classes: 'Classes' },
                    ]}
                  />
                </div>
              </>
            )}
            {activeTab == ComponentTab.DesignTokens && (
              <>
                {radios.tokens.map((radio) => (
                  <ComponentDesignTokens
                    key={radio.id}
                    transformer={transformRadioComponentTokensToScssVariables}
                    componentName={`Radio - ${startCase(radio.activity)}`}
                    designComponents={designComponents.filter((component) => component.activity === radio.activity)}
                    previewObject={radio}
                  >
                    <RadioDisplay radio={radio.preview} />
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
export default RadioPage;
