import * as React from 'react';
import type { GetStaticProps } from 'next';
import startCase from 'lodash/startCase';
import { getConfig, getPreview } from 'config';
import Icon from 'components/Icon';
import IframeResizer from 'iframe-resizer-react';
import type { PreviewObject } from 'figma-exporter/src/types';
import type { CheckboxDesignComponent, CheckboxLayoutComponent } from 'figma-exporter/src/exporters/components/component_sets/checkbox';
import { transformCheckboxComponentTokensToScssVariables } from 'figma-exporter/src/transformers/scss/components/checkbox';
import { ComponentTab } from 'types/tabs';
import ComponentDesignTokens from 'components/ComponentDesignTokens';
import Head from 'next/head';
import Header from 'components/Header';
import * as util from 'components/util';
import CustomNav from 'components/SideNav/Custom';
import AnchorNav from 'components/AnchorNav';
import ComponentGuidelines from 'components/ComponentGuidelines';
import { CodeHighlight } from 'components/Markdown/CodeHighlight';
import { ComponentNotFound } from 'components/ComponentNotFound';

const CheckboxDisplay: React.FC<{ checkbox: PreviewObject | undefined }> = ({ checkbox }) => {
  return (
    <IframeResizer
      style={{
        width: '1px',
        minWidth: '100%',
      }}
      heightCalculationMethod="bodyOffset"
      srcDoc={checkbox?.preview}
      scrolling={false}
      checkOrigin={false}
    />
  );
};

const config = getConfig();

const designComponents = config.components.checkboxes.filter(
  (component): component is CheckboxDesignComponent => component.componentType === 'design'
);

const checkboxes = {
  design: designComponents
    .filter((component) => component.theme === 'light')
    .filter((component) => component.state !== 'hover')
    .filter((component) => component.activity === 'off')
    .sort(function (a, b) {
      let l = config.component_sort.indexOf(a.state) >>> 0;
      let r = config.component_sort.indexOf(b.state) >>> 0;
      return l !== r ? l - r : a.state.localeCompare(b.state);
    })
    .map((checkbox) => {
      const preview = getPreview().components.checkboxes.find((item) => item.id === checkbox.id);

      return {
        ...checkbox,
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
      const preview = getPreview().components.checkboxes.find((item) => item.id === checkbox.id);

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
  return util.fetchCompDocPageMarkdown('docs/components/', 'checkbox', `/components`);
};

const CheckboxPage = ({ content, menu, metadata, current, componentFound }: util.ComponentDocumentationProps) => {
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
                  {checkboxes.design.map((checkbox) => (
                    <div key={`${checkbox.id}`} id={checkbox.id}>
                      <h4>{startCase(checkbox.state)} Checkbox</h4>
                      <p>{checkbox.description}</p>
                      <div className="c-component-preview">
                        <CheckboxDisplay checkbox={checkbox.preview} />
                      </div>
                      <CodeHighlight data={checkbox.preview} />
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
                        {checkboxes.design.map((checkbox) => (
                          <tr key={`classes-${checkbox.id}`}>
                            <td>{startCase(checkbox.state)} Checkbox</td>
                            <td>
                              <code>btn btn-{checkbox.state}</code>
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
                      Object.assign({}, ...[...checkboxes.design.map((obj) => ({ [obj.id]: `${startCase(obj.state)} Checkbox` }))]),
                      { guidelines: 'Component Guidelines' },
                      { classes: 'Classes' },
                    ]}
                  />
                </div>
              </>
            )}
            {activeTab == ComponentTab.DesignTokens && (
              <>
                {checkboxes.tokens.map((checkbox) => (
                  <ComponentDesignTokens
                    key={checkbox.id}
                    transformer={transformCheckboxComponentTokensToScssVariables}
                    componentName={`Checkbox - ${startCase(checkbox.activity)}`}
                    designComponents={designComponents.filter((component) => component.activity === checkbox.activity)}
                    previewObject={checkbox}
                  >
                    <CheckboxDisplay checkbox={checkbox.preview} />
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
export default CheckboxPage;
