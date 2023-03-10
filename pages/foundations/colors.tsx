import * as React from 'react';
import type { GetStaticProps, NextPage } from 'next';
import groupBy from 'lodash/groupBy';
import upperFirst from 'lodash/upperFirst';
import Icon from 'components/Icon';
import { getConfig } from 'config';
import { lowerCase } from 'lodash';
import Head from 'next/head';
import * as util from 'components/util';
import Header from 'components/Header';
import CustomNav from 'components/SideNav/Custom';
import AnchorNav from 'components/AnchorNav';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';

const config = getConfig();

const colorGroups = Object.fromEntries(
  Object.entries(groupBy(config.design.color, 'group'))
    .map(([groupKey, colors]) => {
      return [
        groupKey,
        colors.map((colorObj) => {
          return {
            ...colorObj,
          };
        }),
      ] as const;
    })
    .sort(function (a, b) {
      const l = config.color_sort.indexOf(a[0]) >>> 0;
      const r = config.color_sort.indexOf(b[0]) >>> 0;

      return l !== r ? l - r : a[0].localeCompare(b[0]);
    })
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
  return util.fetchDocPageMarkdown('docs/foundations/', 'colors', `/foundations`);
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
            <div className="o-col-9@xl">
              {Object.keys(colorGroups).map((group) => (
                <div key={group} id={`${lowerCase(group)}-colors`}>
                  <div className="o-row">
                    <div className="o-col-10@md">
                      <div>
                        <h3 className="u-mb-1">{upperFirst(group)} Colors</h3>
                        <p className="u-mb-4">Colors that are used most frequently across all pages and components.</p>
                      </div>
                    </div>
                  </div>
                  <div className="o-row">
                    <div className="o-col-12@md">
                      <div className="o-stack-2@md o-stack-2@lg u-mb-n-4">
                        {colorGroups[group].map((color) => (
                          <div className="c-color-preview" key={`color-${color.group}-${color.name}`}>
                            <div className="c-color-preview__wrapper">
                              <span className="c-color-preview__sample" style={{ backgroundColor: color.hex }}></span>
                              <h5>{color.name}</h5>
                              <code>HEX: {color.hex}</code>
                              <code>
                                RGBa: {Math.floor(color.rgb.r * 100)},{Math.floor(color.rgb.g * 100)},{Math.floor(color.rgb.b * 100)},
                                {color.rgb.a}
                              </code>
                              <code>Sass: {color.sass}</code>
                            </div>
                          </div>
                        ))}
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
                    ...Object.keys(colorGroups).map((group) => ({ [`${group}-colors`]: `${upperFirst(group)} Colors` })),
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
