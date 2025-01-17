import { getClientConfig } from '@handoff/config';
import { isShadowEffectType } from '@handoff/exporters/utils';
import { EffectParametersObject } from '@handoff/types';
import { lowerCase } from 'lodash';
import groupBy from 'lodash/groupBy';
import upperFirst from 'lodash/upperFirst';
import type { GetStaticProps } from 'next';
import * as React from 'react';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import rehypeRaw from 'rehype-raw';
import { DownloadTokens } from '../../components/DownloadTokens';
import Layout from '../../components/Layout/Main';
import { MarkdownComponents } from '../../components/Markdown/MarkdownComponents';
import AnchorNav from '../../components/Navigation/AnchorNav';
import HeadersType from '../../components/Typography/Headers';
import * as util from '../../components/util';
import { getTokens } from '../../components/util';

export const applyEffectToCssProperties = (effect: EffectParametersObject, cssProperties: React.CSSProperties) => {
  if (isShadowEffectType(effect.type)) {
    cssProperties.boxShadow = cssProperties.boxShadow ? `${cssProperties.boxShadow}, ${effect.value}` : effect.value;
  }
};

/**
 * This statically renders content from the markdown, creating menu and providing
 * metadata
 *
 * This is all done statically at build time
 * @param context GetStaticProps
 * @returns
 */
export const getStaticProps: GetStaticProps = async () => {
  // Read current slug

  return {
    props: {
      config: getClientConfig(),
      ...util.fetchFoundationDocPageMarkdown('docs/foundations/', 'effects', `/foundations`).props,
      design: getTokens().design,
    },
  };
};

const ColorsPage = ({
  content,
  menu,
  metadata,
  current,
  css,
  scss,
  styleDictionary,
  types,
  design,
  config,
}: util.FoundationDocumentationProps) => {
  const effectGroups = Object.fromEntries(
    Object.entries(groupBy(design.effect, 'group')).map(([groupKey, effects]) => {
      return [
        groupKey,
        effects.map((effectObj) => {
          return {
            ...effectObj,
          };
        }),
      ] as const;
    })
  );
  return (
    <Layout config={config} menu={menu} metadata={metadata} current={current}>
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H1>{metadata.title}</HeadersType.H1>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{metadata.description}</p>
        <DownloadTokens componentId="colors" scss={scss} css={css} styleDictionary={styleDictionary} types={types} />
      </div>
      <div className="mt-10">
        {Object.keys(effectGroups).map((group) => (
          <div key={group} id={`${lowerCase(group)}-effects`}>
            <div className="o-row">
              <div className="o-col-10@md">
                <div>
                  <h3 className="u-mb-4">{upperFirst(group)} Effects</h3>
                </div>
              </div>
            </div>
            <div className="o-row">
              <div className="o-col-12@md">
                <div className="o-stack-2@md o-stack-2@lg u-mb-n-4">
                  {effectGroups[group].map((effect) => {
                    // initialize preview css properties
                    const cssProperties: React.CSSProperties = {};
                    // apply background color
                    cssProperties.backgroundColor = '#FFF';
                    // apply effects
                    effect.effects.forEach((effect: EffectParametersObject) => {
                      applyEffectToCssProperties(effect, cssProperties);
                    });

                    return (
                      <div className="c-color-preview" key={`effect-${effect.group}-${effect.name}`}>
                        <div className="c-color-preview__wrapper">
                          <span className="c-color-preview__sample" style={cssProperties}></span>
                          <h5>{effect.name}</h5>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <hr />
          </div>
        ))}

        <AnchorNav
          groups={[
            Object.assign({}, ...[...Object.keys(effectGroups).map((group) => ({ [`${group}-effects`]: `${upperFirst(group)} Effects` }))]),
          ]}
        />

        <ReactMarkdown components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </div>
    </Layout>
  );
};
export default ColorsPage;
