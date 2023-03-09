import * as React from 'react';
import type { GetStaticProps, NextPage } from 'next';
import uniq from 'lodash/uniq';
import * as fs from 'fs-extra';
import { getConfig } from 'config';
import Icon from 'components/Icon';

import Head from 'next/head';
import { DocumentationProps, fetchDocPageMarkdown, SectionLink, staticBuildMenu } from 'components/util';
import Header from 'components/Header';
import { ReactMarkdown } from 'react-markdown/lib/react-markdown';
import CustomNav from 'components/SideNav/Custom';

const config = getConfig();
const fontFamilies: string[] = uniq(config.design.typography.map((type) => type.values.fontFamily));
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
  const markdown = fetchDocPageMarkdown('docs/assets/', 'fonts', `/assets`);
  const fonts = fs.readdirSync('public/fonts');
  const customFonts: string[] = [];
  console.log(fonts);
  fonts.map((font) => {
    if (font.endsWith('.zip')) {
      // We have a custom font
      const name = font.replace('.zip', '');
      customFonts.push(name);
    }
  });
  return {
    props: { ...markdown.props, customFonts },
  };
};

interface FontDocProps extends DocumentationProps {
  customFonts: string[];
}

const FontsPage = ({ content, menu, metadata, current, customFonts }: FontDocProps) => {
  const fontLinks: string[] = fontFamilies.map((fontFamily) => {
    const machine_name = fontFamily.replace(/\s/g, '');
    const custom = customFonts.find((font) => font === machine_name);
    if (custom) {
      return `/fonts/${machine_name}.zip`;
    } else {
      return `https://fonts.google.com/specimen/${fontFamily}`;
    }
  });
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
            {metadata.image && <Icon name={metadata.image} className="c-hero__img c-hero__image--small" />}
          </div>
          {fontFamilies.map((fontFamily, i) => (
            <React.Fragment key={fontFamily}>
              <div className="o-row u-justify-between">
                <div className="o-col-5@md">
                  <h4>{fontFamily}</h4>
                </div>
                <div className="o-col-6@md">
                  <div className="c-card">
                    <Icon name="file-zip" className="c-card__icon" />
                    <h4>{fontFamily}</h4>
                    <p>Font files for installing on a local machine.</p>
                    <p>
                      <a href={fontLinks[i]}>Download Font</a>
                    </p>
                  </div>
                </div>
              </div>
              <hr />
            </React.Fragment>
          ))}

          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </section>
    </div>
  );
};
export default FontsPage;
