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
      config: util.getClientRuntimeConfig(),
      ...util.fetchFoundationDocPageMarkdown('docs/foundations/', 'effects', `/foundations`).props,
      design: getTokens().design,
    },
  };
};

const EffectsPage = ({
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

      <div className="lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_280px]">
        <div>
          {Object.keys(effectGroups).map((group) => (
            <div key={group} id={`${lowerCase(group)}-effects`}>
              <h3 className="u-mb-4">{upperFirst(group)} Effects</h3>
              <div className="@container">
                <div className="mb-6 grid grid-cols-1 gap-6 @md:grid-cols-2">
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
                      <div key={`effect-${effect.group}-${effect.name}`}>
                        <span className="group relative mb-2 block h-32 w-full rounded-lg" style={cssProperties}></span>
                        <p className="mb-1 text-sm font-medium">{effect.name}</p>
                        <small className="font-mono text-xs font-light text-gray-400">{effect.reference}</small>
                        <small className="block font-mono text-xs font-light text-gray-400">
                          {effect.effects.map((e, i) => (
                            <span key={i}>
                              {e.value}
                              {i < effect.effects.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </small>
                      </div>
                    );
                  })}
                </div>
              </div>
              <hr />
            </div>
          ))}
        </div>

        <AnchorNav
          groups={[
            Object.assign(
              {},
              ...[...Object.keys(effectGroups).map((group) => ({ [`${lowerCase(group)}-effects`]: `${upperFirst(group)} Effects` }))]
            ),
          ]}
        />

        <ReactMarkdown className="prose" components={MarkdownComponents} rehypePlugins={[rehypeRaw]}>
          {content}
        </ReactMarkdown>
      </div>
    </Layout>
  );
};
export default EffectsPage;
