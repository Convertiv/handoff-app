import * as React from 'react';
import type { GetStaticProps, NextPage } from 'next';
import startCase from 'lodash/startCase';
import { getConfig, getPreview } from 'config';
import Icon from 'components/Icon';
import IframeResizer from 'iframe-resizer-react';
import type { PreviewObject } from 'figma-exporter/src/types';
import type { ButtonDesignComponent, ButtonLayoutComponent } from 'figma-exporter/src/exporters/components/component_sets/button';
import { transformButtonComponentTokensToScssVariables } from 'figma-exporter/src/transformers/scss/components/button';
import { ComponentTab } from 'types/tabs';
import ComponentDesignTokens from 'components/ComponentDesignTokens';
import Head from 'next/head';
import Header from 'components/Header';
import * as util from 'components/util';
import CustomNav from 'components/SideNav/Custom';
import AnchorNav from 'components/AnchorNav';
import ComponentGuidelines from 'components/ComponentGuidelines';
import { CodeHighlight } from 'components/Markdown/CodeHighlight';


const ButtonDisplay: React.FC<{ button: PreviewObject | undefined }> = ({ button }) => {
  return (
    <IframeResizer
      style={{
        width: '1px',
        minWidth: '100%',
      }}
      heightCalculationMethod="bodyOffset"
      srcDoc={button?.preview}
      scrolling={false}
      checkOrigin={false}
    />
  );
};

const state_sort = ['default', 'hover', 'focus', 'active', 'disabled'];
const size_sort = ['xl', 'lg', 'md', 'sm', 'xs'];

const config = getConfig();

const designComponents = config.components.buttons.filter(
  (component): component is ButtonDesignComponent => component.componentType === 'design'
);

const buttons = {
  design: designComponents
    .filter((component) => component.theme === 'light' && component.state === 'default')
    .sort(function (a, b) {
      let l = config.component_sort.indexOf(a.type) >>> 0;
      let r = config.component_sort.indexOf(b.type) >>> 0;
      return l !== r ? l - r : a.type.localeCompare(b.type);
    })
    .map((button) => {
      const preview = getPreview().components.buttons.find((item) => item.id === button.id);
      return {
        ...button,
        preview,
      };
    }),
  sizes: config.components.buttons
    .filter((component): component is ButtonLayoutComponent => component.componentType === 'layout')
    .sort(function (a, b) {
      return size_sort.indexOf(a.size) - size_sort.indexOf(b.size);
    })
    .map((button) => {
      const preview = getPreview().components.buttons.find((item) => item.id === button.id);
      return {
        ...button,
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
  return util.fetchDocPageMarkdown('docs/components/', 'button', `/components`);
};

const ButtonsPage = ({ content, menu, metadata, current }: util.DocumentationProps) => {
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
                  {buttons.design.map((button) => (
                    <div key={`${button.id}`} id={button.id}>
                      <h4>{startCase(button.type)} Button</h4>
                      <p>{button.description}</p>
                      <div className="c-component-preview">
                        <ButtonDisplay button={button.preview} />
                      </div>
                      <CodeHighlight data={button.preview} />
                      <hr />
                    </div>
                  ))}

                  {buttons.sizes.map((button) => (
                    <div key={button.id} id={button.id}>
                      <h4>{startCase(button.size)} Button</h4>
                      <div className="c-component-preview">
                        <ButtonDisplay button={button.preview} />
                      </div>
                      <CodeHighlight data={button.preview} />
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
                        {buttons.design.map((button) => (
                          <tr key={`classes-${button.id}`}>
                            <td>{startCase(button.type)} Button</td>
                            <td>
                              <code>btn btn-{button.type}</code>
                            </td>
                          </tr>
                        ))}
                        {buttons.sizes.map((button) => (
                          <tr key={`classes-${button.id}`}>
                            <td>{startCase(button.size)} Button</td>
                            <td>
                              <code>btn btn-{button.size}</code>
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
                      Object.assign({}, ...[...buttons.design.map((obj) => ({ [obj.id]: `${startCase(obj.type)} Button` }))]),
                      Object.assign({}, ...[...buttons.sizes.map((obj) => ({ [obj.id]: `${startCase(obj.size)} Button` }))]),
                      { guidelines: 'Component Guidelines' },
                      { classes: 'Classes' },
                    ]}
                  />
                </div>
              </>
            )}

            {activeTab == ComponentTab.DesignTokens && (
              <>
                {buttons.design.map((button) => (
                  <ComponentDesignTokens
                    key={button.id}
                    transformer={transformButtonComponentTokensToScssVariables}
                    componentName={'Button'}
                    designComponents={designComponents}
                    previewObject={button}
                  >
                    <ButtonDisplay button={button.preview} />
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
export default ButtonsPage;
