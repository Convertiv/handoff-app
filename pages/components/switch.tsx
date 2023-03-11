import * as React from 'react';
import type { GetStaticProps } from 'next';
import IframeResizer from 'iframe-resizer-react';
import { getConfig, getPreview } from 'config';
import Icon from 'components/Icon';
import type { PreviewObject } from 'figma-exporter/src/types';
import { transformSwitchComponentTokensToScssVariables } from 'figma-exporter/src/transformers/scss/components/switch';
import { SwitchDesignComponent } from 'figma-exporter/src/exporters/components/component_sets/switch';
import { startCase } from 'lodash';
import { ComponentTab } from 'types/tabs';
import Head from 'next/head';
import ComponentDesignTokens from 'components/ComponentDesignTokens';
import * as util from 'components/util';
import Header from 'components/Header';
import CustomNav from 'components/SideNav/Custom';
import AnchorNav from 'components/AnchorNav';
import ComponentGuidelines from 'components/ComponentGuidelines';
import { CodeHighlight } from 'components/util/CodeHighlight';

const SwitchDisplay: React.FC<{ component: PreviewObject | undefined }> = ({ component }) => {
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


const config = getConfig();

const designComponents = config.components.switches.filter(
  (component): component is SwitchDesignComponent => component.componentType === 'design'
);

const switches = {
  design: designComponents
    .filter((component) => component.theme === 'light')
    .filter((component) => component.state !== 'hover')
    .filter((component) => component.activity === 'off')
    .sort(function (a, b) {
      let l = config.component_sort.indexOf(a.state) >>> 0;
      let r = config.component_sort.indexOf(b.state) >>> 0;
      return l !== r ? l - r : a.state.localeCompare(b.state);
    })
    .map((component) => {
      const preview = getPreview().components.switches.find((item) => item.id === component.id);

      return {
        ...component,
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
    .map((component) => {
      const preview = getPreview().components.switches.find((item) => item.id === component.id);

      return {
        ...component,
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
  return util.fetchDocPageMarkdown('docs/components/', 'switch', `/components`);
};

const SwitchPage = ({ content, menu, metadata, current }: util.DocumentationProps) => {
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
                  {switches.design.map((component) => (
                    <div key={`${component.id}`} id={component.id}>
                      <h4>{startCase(component.state)} Switch</h4>
                      <p>{component.description}</p>
                      <div className="c-component-preview">
                        <SwitchDisplay component={component.preview} />
                      </div>
                      <CodeHighlight data={component.preview} />
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
                        {switches.design.map((component) => (
                          <tr key={`classes-${component.id}`}>
                            <td>Switch</td>
                            <td>
                              <code>form-check form-switch</code>
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
                      Object.assign({}, ...[...switches.design.map((obj) => ({ [obj.id]: `${startCase(obj.state)} Switch` }))]),
                      { guidelines: 'Component Guidelines' },
                      { classes: 'Classes' },
                    ]}
                  />
                </div>
              </>
            )}
            {activeTab == ComponentTab.DesignTokens && (
              <>
                {switches.tokens.map((component) => (
                  <ComponentDesignTokens
                    key={component.id}
                    transformer={transformSwitchComponentTokensToScssVariables}
                    componentName={`Switch - ${startCase(component.activity)}`}
                    designComponents={designComponents.filter((designComponent) => designComponent.activity === component.activity)}
                    previewObject={component}
                  >
                    <SwitchDisplay component={component.preview} />
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
export default SwitchPage;
