import * as React from 'react';
import type { GetStaticProps } from 'next';
import Icon from 'components/Icon';
import { getConfig, getPreview } from 'config';
import { InputComponents, InputDesignComponent } from 'figma-exporter/src/exporters/components/component_sets/input';
import { transformInputComponentTokensToScssVariables } from 'figma-exporter/src/transformers/scss/components/input';
import type { PreviewObject } from 'figma-exporter/src/types';
import IframeResizer from 'iframe-resizer-react';
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
import { DownloadTokens } from 'components/DownloadTokens';


const InputDisplay: React.FC<{ input: InputThemePair; theme: 'light' | 'dark' }> = ({ input, theme }) => {
  return (
    <IframeResizer
      style={{
        width: '1px',
        minWidth: '100%',
      }}
      heightCalculationMethod="bodyOffset"
      srcDoc={input.light?.preview?.preview}
      scrolling={false}
      checkOrigin={false}
    />
  );
};

const state_sort = ['default', 'disabled', 'error', 'complete'];

interface InputComponentTokensHighlight extends InputDesignComponent {
  preview: PreviewObject | undefined;
}

interface InputThemePair {
  light: InputComponentTokensHighlight | undefined;
  dark: InputComponentTokensHighlight | undefined;
}

const getByState = (components: InputComponents, state: string): InputThemePair => {
  const find_light = components.find(
    (component): component is InputDesignComponent =>
      component.componentType === 'design' && component.theme === 'light' && component.state === state
  );

  const find_dark = components.find(
    (component): component is InputDesignComponent =>
      component.componentType === 'design' && component.theme === 'dark' && component.state === state
  );

  const find_light_preview = find_light ? getPreview().components.inputs.find((preview) => preview.id === find_light.id) : undefined;

  const find_dark_preview = find_dark ? getPreview().components.inputs.find((preview) => preview.id === find_dark.id) : undefined;

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

const designComponents = config.components.inputs.filter(
  (component): component is InputDesignComponent => component.componentType === 'design'
);

const states = {
  default: getByState(config.components.inputs, 'default'),
  error: getByState(config.components.inputs, 'error'),
  complete: getByState(config.components.inputs, 'complete'),
  disabled: getByState(config.components.inputs, 'disabled'),
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
  return util.fetchCompDocPageMarkdown('docs/components/', 'input', `/components`);
};

const InputPage = ({ content, menu, metadata, current, componentFound, css, scss }: util.ComponentDocumentationProps) => {
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
              <DownloadTokens componentId="inputs" scss={scss} css={css} />
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
                  <div id="default-inputs">
                    <h3>Default Inputs</h3>
                    <p>{states.default.light?.description}</p>
                    <div className="c-component-preview">
                      <InputDisplay input={states.default} theme="light" />
                    </div>
                    <CodeHighlight data={states.default.light?.preview} />
                  </div>

                  <div id="validation-and-errors">
                    <h3>Validation and Errors</h3>
                    <p>{states.error.light?.description}</p>
                    <div className="c-component-preview">
                      <InputDisplay input={states.error} theme="light" />
                    </div>
                    <CodeHighlight data={states.error.light?.preview} />
                  </div>

                  <div id="disabled-active-states">
                    <h3>Disabled Fields</h3>
                    <p>{states.disabled.light?.description}</p>
                    <div className="c-component-preview">
                      <InputDisplay input={states.disabled} theme="light" />
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
                        'default-inputs': 'Default Inputs',
                        'validation-and-errors': 'Validation and Errors',
                        'disabled-active-states': 'Disabled & Active states',
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
                    transformer={transformInputComponentTokensToScssVariables}
                    componentName={'Default Input'}
                    designComponents={designComponents}
                    previewObject={states.default.light}
                    overrides={{
                      states: ['default', 'hover', 'active'],
                    }}
                  >
                    <InputDisplay input={states.default} theme={'light'} />
                  </ComponentDesignTokens>
                )}
                {states.error.light && (
                  <ComponentDesignTokens
                    key={states.error.light.id}
                    transformer={transformInputComponentTokensToScssVariables}
                    componentName={'Validation and Errors'}
                    designComponents={designComponents}
                    previewObject={states.error.light}
                    overrides={{
                      states: ['error', 'hover', 'active'],
                    }}
                  >
                    <InputDisplay input={states.error} theme={'light'} />
                  </ComponentDesignTokens>
                )}
                {states.complete.light && (
                  <ComponentDesignTokens
                    key={states.complete.light.id}
                    transformer={transformInputComponentTokensToScssVariables}
                    componentName={'Complete Input'}
                    designComponents={designComponents}
                    previewObject={states.complete.light}
                    overrides={{
                      states: ['complete', 'hover', 'active'],
                    }}
                  >
                    <InputDisplay input={states.complete} theme={'light'} />
                  </ComponentDesignTokens>
                )}
                {states.disabled.light && (
                  <ComponentDesignTokens
                    key={states.disabled.light.id}
                    transformer={transformInputComponentTokensToScssVariables}
                    componentName={'Disabeld Input'}
                    designComponents={designComponents}
                    previewObject={states.disabled.light}
                    overrides={{
                      states: ['disabled', 'hover'],
                    }}
                  >
                    <InputDisplay input={states.disabled} theme={'light'} />
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
export default InputPage;
