import * as React from 'react';
import type { GetStaticProps } from 'next';
import groupBy from 'lodash/groupBy';
import upperFirst from 'lodash/upperFirst';
import Icon from 'components/Icon';
import { getConfig } from 'config';
import { lowerCase } from 'lodash';
import Head from 'next/head';
import * as util from 'components/util';
import Header from 'components/Header';
import { EffectParametersObject } from 'figma-exporter/src/types';
import CustomNav from 'components/SideNav/Custom';
import AnchorNav from 'components/AnchorNav';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';

const config = getConfig();

const effectGroups = Object.fromEntries(
  Object.entries(groupBy(config.design.effect, 'group')).map(([groupKey, effects]) => {
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

export const applyEffectToCssProperties = (effect: EffectParametersObject, cssProperties: React.CSSProperties) => {
  switch (effect.type) {
    case 'DROP_SHADOW':
      const value = `${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px rgba(${Math.floor(effect.color.r * 100)},${Math.floor(
        effect.color.g * 100
      )},${Math.floor(effect.color.b * 100)},${effect.color.a})`;
      cssProperties.boxShadow = cssProperties.boxShadow ? `${cssProperties.boxShadow}, ${value}` : value;
      break;
    default:
      break;
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
export const getStaticProps: GetStaticProps = async (context) => {
  // Read current slug
  return util.fetchDocPageMarkdown('docs/foundations/', 'effects', `/foundations`);
};

const ColorsPage = ({ content, menu, metadata, current }: util.DocumentationProps) => {
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
              <h1 className="c-title--extra-large">{metadata.title}</h1>
              <p>{metadata.description}</p>
            </div>
            {metadata.image && <Icon name={metadata.image} className="c-hero__img c-hero__img--small" />}
          </div>
          <div className="o-row">
            <div className="o-col-9 @md">
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
                          effect.effects.forEach((effect) => {
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
            </div>
            <div className="o-col-3@xl u-visible@lg">
              <AnchorNav
                groups={[
                  Object.assign({}, ...[
                    ...Object.keys(effectGroups).map((group) => ({ [`${group}-effects`]: `${upperFirst(group)} Effects` })),
                  ]),
                ]}
              />
            </div>
          </div>
        </div>
      </section>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
};
export default ColorsPage;
