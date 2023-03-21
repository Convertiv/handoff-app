import * as React from 'react';
import type { GetStaticProps } from 'next';
import IframeResizer from 'iframe-resizer-react';
import Icon from 'components/Icon';
import { getConfig, getPreview } from 'config';
import type { PreviewObject } from 'figma-exporter/src/types';
import type { SelectComponents, SelectDesignComponent } from 'figma-exporter/src/exporters/components/component_sets/select';
import { transformSelectComponentTokensToScssVariables } from 'figma-exporter/src/transformers/scss/components/select';
import { ComponentTab } from 'types/tabs';
import Head from 'next/head';
import ComponentDesignTokens from 'components/ComponentDesignTokens';
import * as util from 'components/util';
import Header from 'components/Header';
import CustomNav from 'components/SideNav/Custom';
import AnchorNav from 'components/AnchorNav';
import ComponentGuidelines from 'components/ComponentGuidelines';
import { CodeHighlight } from 'components/Markdown/CodeHighlight';
import { ComponentNotFound } from 'components/ComponentNotFound';


const SelectDisplay: React.FC<{ select: SelectThemePair; theme: 'light' | 'dark' }> = ({ select, theme }) => {
  return (
    <IframeResizer
      style={{
        width: '1px',
        minWidth: '100%',
      }}
      heightCalculationMethod="lowestElement"
      checkOrigin={false}
      srcDoc={select.light?.preview?.preview}
      scrolling={false}
    />
  );
};
const state_sort = ['default', 'disabled', 'error', 'complete'];

interface SelectComponentTokensHighlight extends SelectDesignComponent {
  preview: PreviewObject | undefined;
}

interface SelectThemePair {
  light: SelectComponentTokensHighlight | undefined;
  dark: SelectComponentTokensHighlight | undefined;
}

const getByState = (components: SelectComponents, state: string): SelectThemePair => {
  const find_light = components.find(
    (component): component is SelectDesignComponent =>
      component.componentType === 'design' && component.theme === 'light' && component.state === state
  );
  const find_dark = components.find(
    (component): component is SelectDesignComponent =>
      component.componentType === 'design' && component.theme === 'dark' && component.state === state
  );

  const find_light_preview = find_light ? getPreview().components.selects.find((preview) => preview.id === find_light.id) : undefined;

  const find_dark_preview = find_dark ? getPreview().components.selects.find((preview) => preview.id === find_dark.id) : undefined;

  let light, dark;
  if (find_light) {
    light = {
      ...find_light,
      preview: find_light_preview,
    };
  }
  if (find_dark) {
    dark = {
      ...find_dark,
      preview: find_dark_preview,
    };
  }
  return {
    light,
    dark,
  };
};

const config = getConfig();

const designComponents = config.components.selects.filter(
  (component): component is SelectDesignComponent => component.componentType === 'design'
);

const states = {
  default: getByState(config.components.selects, 'default'),
  error: getByState(config.components.selects, 'error'),
  disabled: getByState(config.components.selects, 'disabled'),
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
  return util.fetchCompDocPageMarkdown('docs/components/', 'select', `/components`);
};

const SelectPage = ({ content, menu, metadata, current, componentFound }: util.ComponentDocumentationProps) => {
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
                  <div id="default-select">
                    <h3>Default Select</h3>
                    <p>{states.default.light?.description}</p>
                    <div className="c-component-preview">
                      <SelectDisplay select={states.default} theme="light" />
                    </div>
                    <CodeHighlight data={states.default.light?.preview} />
                  </div>

                  <div id="validation-and-errors">
                    <h3>Validation and Errors</h3>
                    <p>{states.error.light?.description}</p>
                    <div className="c-component-preview">
                      <SelectDisplay select={states.error} theme="light" />
                    </div>
                    <CodeHighlight data={states.error.light?.preview} />
                  </div>

                  <div id="disabled-fields">
                    <h3>Disabled Fields</h3>
                    <p>{states.disabled.light?.description}</p>
                    <div className="c-component-preview">
                      <SelectDisplay select={states.disabled} theme="light" />
                    </div>
                    <CodeHighlight data={states.disabled.light?.preview} />
                    <hr />
                  </div>

                  <div id="guidelines">
                    <ComponentGuidelines content={content} />
                  </div>
                </div>
                <div className="o-col-3@xl u-visible@lg">
                  <AnchorNav
                    groups={[
                      {
                        'default-select': 'Default Select',
                        'validation-and-errors': 'Validation and Errors',
                        'disabled-fields': 'Disabled fields',
                      },
                      { guidelines: 'Component Guidelines' },
                    ]}
                  />
                </div>
              </>
            )}
            {activeTab == ComponentTab.DesignTokens && (
              <>
                {states.default.light && (
                  <ComponentDesignTokens
                    key={states.default.light.id}
                    transformer={transformSelectComponentTokensToScssVariables}
                    componentName={'Default Select'}
                    designComponents={designComponents}
                    previewObject={states.default.light}
                    overrides={{
                      states: ['default', 'hover'],
                    }}
                  >
                    <SelectDisplay select={states.default} theme={'light'} />
                  </ComponentDesignTokens>
                )}
                {states.error.light && (
                  <ComponentDesignTokens
                    key={states.error.light.id}
                    transformer={transformSelectComponentTokensToScssVariables}
                    componentName={'Validation and Errors'}
                    designComponents={designComponents}
                    previewObject={states.error.light}
                    overrides={{
                      states: ['error', 'hover'],
                    }}
                  >
                    <SelectDisplay select={states.error} theme={'light'} />
                  </ComponentDesignTokens>
                )}
                {states.disabled.light && (
                  <ComponentDesignTokens
                    key={states.disabled.light.id}
                    transformer={transformSelectComponentTokensToScssVariables}
                    componentName={'Disabled Fields'}
                    designComponents={designComponents}
                    previewObject={states.disabled.light}
                    overrides={{
                      states: ['disabled', 'hover'],
                    }}
                  >
                    <SelectDisplay select={states.disabled} theme={'light'} />
                  </ComponentDesignTokens>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
export default SelectPage;
